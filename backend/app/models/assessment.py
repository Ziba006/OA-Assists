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

Document shape for a symptoms assessment::

    {
        "_id": ObjectId("..."),
        "user_id": ObjectId("..."),   # owner, from the verified JWT
        "patient_id": "OA-0001",
        "type": "symptoms",
        "symptoms": {
            "knee": "Both",
            "pain_score": 6,
            "symptom_duration": "3–6 months",
            ...
        },
        "created_at": ISODate("...")
    }

The type-specific payload lives under its own key (`xray`, `symptoms`, later
`gait`), so each module adds to this document without reshaping it.

**Symptoms are recorded, not interpreted.** The answers are stored exactly as
submitted. No score, severity, risk band or OA conclusion is derived from them
here or anywhere else, and nothing in the API response implies a diagnosis.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Mapping, Optional

from bson import ObjectId
from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING

from ..database import get_database
from .user import utc_now

# Name of the MongoDB collection that stores assessments.
ASSESSMENTS_COLLECTION = "assessments"

# The assessment modules the platform supports. Gait is not implemented yet.
ASSESSMENT_TYPES = ("xray", "symptoms", "gait")

# The type-specific key inside the document, keyed by assessment type.
TYPE_PAYLOAD_KEY = {
    "xray": "xray",
    "symptoms": "symptoms",
    "gait": "gait",
}

# The only values a symptom answer may take. Constraining them with Literal means
# an unrecognised answer is rejected by validation (422) instead of being stored
# as free text, so the stored data stays analysable later.
KneeSide = Literal["Left", "Right", "Both"]
SymptomDuration = Literal[
    "Less than 1 week",
    "1–4 weeks",
    "1–3 months",
    "3–6 months",
    "More than 6 months",
]
StiffnessFrequency = Literal["Never", "Sometimes", "Often", "Almost always"]
StiffnessAfterRest = Literal["No", "Yes, for a short time", "Yes, for a longer time"]
SwellingFrequency = Literal["Never", "Sometimes", "Often"]
DifficultyLevel = Literal["No difficulty", "Mild", "Moderate", "Severe"]
ClickingFrequency = Literal["Never", "Sometimes", "Often"]
InjuryHistory = Literal["No", "Yes"]
DailyActivityImpact = Literal["Not at all", "Slightly", "Moderately", "Significantly"]


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


class SymptomsAnswers(BaseModel):
    """The recorded answers to the symptoms questionnaire.

    Every field is required and constrained to the options the questionnaire
    offers. There is deliberately no derived field: nothing here is scored,
    banded or interpreted, so a stored document is a record of what the patient
    reported and never an assessment of what it means.
    """

    knee: KneeSide = Field(..., examples=["Both"], description="Which knee the symptoms are in.")
    pain_score: int = Field(
        ...,
        ge=0,
        le=10,
        examples=[6],
        description="Self-reported knee pain on a 0-10 scale.",
    )
    symptom_duration: SymptomDuration
    stiffness: StiffnessFrequency
    stiffness_after_rest: StiffnessAfterRest
    swelling: SwellingFrequency
    walking_difficulty: DifficultyLevel
    stairs_difficulty: DifficultyLevel
    chair_difficulty: DifficultyLevel
    clicking_grinding: ClickingFrequency
    previous_injury_surgery: InjuryHistory
    daily_activity_impact: DailyActivityImpact


class AssessmentPublic(BaseModel):
    """Safe shape of an assessment for API responses.

    Never includes the raw MongoDB `_id` value, and never includes an image.
    """

    id: str = Field(..., description="MongoDB id of the assessment as a string.")
    patient_id: str = Field(..., examples=["OA-0001"])
    type: str = Field(..., examples=["xray"])
    xray: Optional[XrayResult] = Field(default=None)
    symptoms: Optional[SymptomsAnswers] = Field(default=None)
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


async def create_symptoms_assessment(
    *, user_id: ObjectId, patient_id: str, symptoms: Mapping[str, Any]
) -> dict[str, Any]:
    """Persist one symptoms assessment and return the document that was written.

    The answers are stored exactly as given. No score, severity or diagnostic
    conclusion is computed, so the document records what the patient reported
    and nothing more.

    Raises:
        pymongo.errors.PyMongoError: propagated on purpose, so the route can
            report a failed save instead of pretending the answers were stored.
    """
    document = {
        "user_id": user_id,
        "patient_id": patient_id,
        "type": "symptoms",
        "symptoms": dict(symptoms),
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
    symptoms_payload = document.get("symptoms")

    return AssessmentPublic(
        id=str(document["_id"]),
        patient_id=document["patient_id"],
        type=document["type"],
        xray=XrayResult(**xray_payload) if xray_payload else None,
        symptoms=SymptomsAnswers(**symptoms_payload) if symptoms_payload else None,
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
