"""Assessment collection for OA Assist.

An assessment is one result for one patient, produced by one module. Every
document belongs to **both** an owner and a patient:

    User (JWT)  ->  Patient (patient_id)  ->  Assessment (xray / symptoms / gait)

`user_id` is copied from the verified access token, never from the request body.
`patient_id` is the selected patient, and the route verifies that patient belongs
to the caller before anything is written.

The X-ray image is **not** stored. The upload is read into memory, run through
the model and discarded; only the prediction result is persisted.

Document shape for an X-ray assessment::

    {
        "_id": ObjectId("..."),
        "user_id": ObjectId("..."),   # owner, from the verified JWT
        "patient_id": "OA-0001",      # the patient this belongs to
        "type": "xray",
        "xray": {
            "predicted_class": "Healthy",
            "oa_indication": false,
            "confidence": 0.52,
            "probabilities": {"Healthy": 0.52, ...},
            "interpretation": "No OA-associated changes indicated by the model.",
            "note": "This is an AI-assisted preliminary assessment ..."
        },
        "created_at": ISODate("...")
    }

The type-specific payload lives under its own key (`xray`, later `symptoms`,
`gait`), so a symptoms or gait assessment can be added without reshaping this
document.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Mapping, Optional

from bson import ObjectId
from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING

from ..database import get_database
from .user import utc_now

# Name of the MongoDB collection that stores assessments.
ASSESSMENTS_COLLECTION = "assessments"

# The assessment modules the platform supports. Only "xray" is implemented.
ASSESSMENT_TYPES = ("xray", "symptoms", "gait")

# The type-specific key inside the document, keyed by assessment type.
TYPE_PAYLOAD_KEY = {
    "xray": "xray",
    "symptoms": "symptoms",
    "gait": "gait",
}


def get_assessments_collection():
    """Return the async `assessments` collection from the OA Assist database."""
    return get_database()[ASSESSMENTS_COLLECTION]


class XrayResult(BaseModel):
    """The stored result of one X-ray assessment.

    Mirrors what the model returned, so a saved assessment can be shown later
    exactly as it was produced. This is a preliminary result, not a diagnosis.
    """

    predicted_class: str = Field(..., examples=["Healthy"])
    oa_indication: bool = Field(..., examples=[False])
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: dict[str, float]
    interpretation: str
    note: str


class AssessmentPublic(BaseModel):
    """Safe shape of an assessment for API responses.

    Never includes the raw MongoDB `_id` value, and never includes an image.
    """

    id: str = Field(..., description="MongoDB id of the assessment as a string.")
    patient_id: str = Field(..., examples=["OA-0001"])
    type: str = Field(..., examples=["xray"])
    xray: Optional[XrayResult] = Field(default=None)
    created_at: datetime


class AssessmentListResponse(BaseModel):
    """Envelope for GET /api/assessments, newest first."""

    assessments: list[AssessmentPublic] = Field(default_factory=list)


def build_xray_payload(prediction: Mapping[str, Any]) -> dict[str, Any]:
    """Build the `xray` sub-document from a prediction result.

    Only the six stored fields are kept. The image itself is never included.
    """
    return {
        "predicted_class": prediction["predicted_class"],
        "oa_indication": prediction["oa_indication"],
        "confidence": prediction["confidence"],
        "probabilities": prediction["probabilities"],
        "interpretation": prediction["interpretation"],
        "note": prediction["note"],
    }


async def create_xray_assessment(
    *, user_id: ObjectId, patient_id: str, prediction: Mapping[str, Any]
) -> dict[str, Any]:
    """Persist one X-ray assessment and return the document that was written.

    Raises:
        pymongo.errors.PyMongoError: propagated on purpose, so the route can
            report a failed save instead of pretending the result was stored.
    """
    document = {
        "user_id": user_id,
        "patient_id": patient_id,
        "type": "xray",
        "xray": build_xray_payload(prediction),
        "created_at": utc_now(),
    }

    result = await get_assessments_collection().insert_one(document)
    document["_id"] = result.inserted_id

    return document


async def list_assessments_for_user(
    *, user_id: ObjectId, patient_id: Optional[str] = None, limit: Optional[int] = None
) -> list[dict[str, Any]]:
    """Return the caller's assessments, newest first.

    Always filtered on `user_id`, so a user can never read another user's
    assessments. When `patient_id` is given it is filtered as well; the caller
    has already verified the patient belongs to the user.
    """
    query: dict[str, Any] = {"user_id": user_id}

    if patient_id:
        query["patient_id"] = patient_id

    cursor = (
        get_assessments_collection()
        .find(query)
        .sort([("created_at", DESCENDING), ("_id", DESCENDING)])
    )

    if limit is not None:
        cursor = cursor.limit(limit)

    return await cursor.to_list(length=None)


def assessment_to_public(document: Mapping[str, Any]) -> AssessmentPublic:
    """Build the response shape from a stored assessment document."""
    xray_payload = document.get("xray")

    return AssessmentPublic(
        id=str(document["_id"]),
        patient_id=document["patient_id"],
        type=document["type"],
        xray=XrayResult(**xray_payload) if xray_payload else None,
        created_at=document["created_at"],
    )


async def count_patient_assessments(patient_id: str) -> int:
    """Return how many assessments reference a patient."""
    return await get_assessments_collection().count_documents({"patient_id": patient_id})


async def ensure_assessment_indexes() -> None:
    """Create the indexes the assessments collection relies on.

    Safe to call more than once.

    - `patient_id` backs the delete guard on a patient.
    - `user_created_at` backs the unfiltered history query.
    - `user_patient_created` backs a single patient's history, which is the
      common case.
    """
    collection = get_assessments_collection()

    await collection.create_index([("patient_id", ASCENDING)], name="patient_id")
    await collection.create_index(
        [("user_id", ASCENDING), ("created_at", DESCENDING)],
        name="user_created_at",
    )
    await collection.create_index(
        [("user_id", ASCENDING), ("patient_id", ASCENDING), ("created_at", DESCENDING)],
        name="user_patient_created",
    )
