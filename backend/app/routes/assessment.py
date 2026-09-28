"""Assessment routes for OA Assist.

Three things live here:

- `router` is mounted at `/api/assessment`. `POST /xray` runs the trained knee OA
  model over an uploaded image and, when it succeeds, saves the result against
  the selected patient. The image is processed in memory and discarded: it is
  never written to MongoDB. `POST /symptoms` records the answers to the symptoms
  questionnaire against the same selected patient.
- `history_router` is mounted at `/api/assessments` and returns the signed-in
  user's saved assessments, newest first.

Both are protected. `user_id` is taken from the verified token, never from the
request, and a patient is only ever written against after the route has
confirmed it belongs to the caller.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

from ..dependencies import get_current_user
from ..models.assessment import (
    AssessmentListResponse,
    AssessmentPublic,
    SymptomsAnswers,
    assessment_to_public,
    create_symptoms_assessment,
    create_xray_assessment,
    list_assessments_for_user,
)
from ..models.patient import get_patients_collection, is_valid_patient_id
from ..models.user import UserSession
from ..services.xray_service import (
    CLASS_NAMES,
    DISCLAIMER,
    MAX_UPLOAD_BYTES,
    SUPPORTED_CONTENT_TYPES,
    SUPPORTED_SUFFIXES,
    InferenceError,
    InvalidImageError,
    ModelUnavailableError,
    predict,
)

router = APIRouter()

# Mounted separately so GET /api/assessments reads naturally.
history_router = APIRouter()

INVALID_PATIENT_ID = "Invalid patient ID. Expected the format OA-0001."
PATIENT_NOT_FOUND = "Patient not found."
DATABASE_UNAVAILABLE = "The database is currently unavailable."
SAVE_FAILED = "The assessment result could not be saved. Please try again."
SYMPTOMS_SAVE_FAILED = "The symptoms could not be saved. Please try again."


class SymptomsRequest(BaseModel):
    """Body of `POST /api/assessment/symptoms`.

    `user_id` is deliberately not a field. Pydantic ignores unknown keys, so a
    `user_id` sent by the client is discarded and the owner always comes from the
    verified token.
    """

    patient_id: str = Field(
        ...,
        examples=["OA-0001"],
        description="Patient the answers belong to.",
    )
    symptoms: SymptomsAnswers = Field(..., description="Answers to the symptoms questionnaire.")


class SymptomsResponse(BaseModel):
    """The symptoms assessment that was just recorded.

    The answers are echoed back exactly as stored. There is no score, severity
    or diagnostic field, because recording symptoms is not diagnosing them.
    """

    assessment_id: str = Field(..., description="Id of the assessment just saved.")
    patient_id: str = Field(..., examples=["OA-0001"])
    type: str = Field(default="symptoms", examples=["symptoms"])
    symptoms: SymptomsAnswers
    created_at: datetime = Field(..., description="When the answers were saved.")


class XrayResponse(BaseModel):
    """Result of one X-ray assessment, and the assessment that was saved.

    `probabilities` are the raw softmax outputs of the model, one per class.
    This is a preliminary, AI-assisted result, not a diagnosis.
    """

    assessment_id: str = Field(..., description="Id of the assessment just saved.")
    patient_id: str = Field(..., examples=["OA-0001"], description="Patient the result belongs to.")
    type: str = Field(default="xray", examples=["xray"], description="Assessment module used.")
    predicted_class: str = Field(..., examples=["Moderate"], description="Predicted class name.")
    class_index: int = Field(
        ..., ge=0, le=len(CLASS_NAMES) - 1, description="Index of the predicted class."
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model probability of the predicted class, taken from the softmax output.",
    )
    probabilities: dict[str, float] = Field(
        ...,
        description="Model probability for every class, keyed by class name.",
        examples=[{"Healthy": 0.05, "Minimal": 0.1, "Moderate": 0.75, "Severe": 0.1}],
    )
    oa_indication: bool = Field(
        ...,
        description="False for Healthy, true for Minimal, Moderate and Severe.",
    )
    interpretation: str = Field(
        ...,
        examples=["Moderate OA-associated changes indicated."],
        description="Plain-language summary. Never a diagnosis.",
    )
    note: str = Field(default=DISCLAIMER, description="Medical disclaimer.")
    created_at: datetime = Field(..., description="When the assessment was saved.")


def _owner_id(current_user: UserSession) -> ObjectId:
    """Return the caller's id as an ObjectId for an ownership query.

    `get_current_user` already produced this from the verified token.

    Raises:
        HTTPException: 401 if the id is somehow not usable.
    """
    try:
        return ObjectId(current_user.id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


async def _require_owned_patient(patient_id: str, owner_id: ObjectId) -> str:
    """Confirm the patient exists and belongs to the caller.

    Raises:
        HTTPException: 400 for a malformed id, 404 when the patient does not
            exist or belongs to another user. The two 404 cases are reported
            identically so the API never confirms another user's id is real.
    """
    if not is_valid_patient_id(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=INVALID_PATIENT_ID,
        )

    try:
        patient = await get_patients_collection().find_one(
            {"patient_id": patient_id, "user_id": owner_id}, {"_id": 1}
        )
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=DATABASE_UNAVAILABLE,
        ) from None

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=PATIENT_NOT_FOUND,
        )

    return patient_id


@router.post(
    "/xray",
    response_model=XrayResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess a knee X-ray image and save the result for a patient",
)
async def assess_xray(
    file: UploadFile = File(..., description="Knee X-ray image (JPG/JPEG or PNG)."),
    patient_id: str = Form(
        ...,
        description="Patient the assessment belongs to, for example OA-0001.",
        examples=["OA-0001"],
    ),
    current_user: UserSession = Depends(get_current_user),
) -> XrayResponse:
    """Run the trained knee OA model over an uploaded X-ray and save the result.

    Requires a valid access token (`Authorization: Bearer <access_token>`).

    Order of operations:

    1. the patient id is validated and checked against the signed-in user, so an
       assessment can never be written for somebody else's patient
    2. the image is validated, converted to grayscale, resized to 224x224, turned
       back into 3 channels and passed through the model
    3. only if the model succeeded is the result saved

    If the model fails, or the patient is not the caller's, nothing is written.
    The image itself is never stored: it is read into memory, used and dropped.
    """
    owner_id = _owner_id(current_user)
    patient_id = await _require_owned_patient(patient_id, owner_id)

    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file was uploaded.",
        )

    content_type = (file.content_type or "").lower()
    suffix = ("." + file.filename.rsplit(".", 1)[-1].lower()) if "." in file.filename else ""

    if content_type not in SUPPORTED_CONTENT_TYPES and suffix not in SUPPORTED_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type. Upload a JPG or PNG file.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The image is too large. Upload a file of 10 MB or less.",
        )

    # From here on, a failure must not create an assessment.
    try:
        result = predict(image_bytes)
    except InvalidImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file could not be read as an image.",
        ) from None
    except ModelUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The X-ray assessment service is temporarily unavailable.",
        ) from None
    except InferenceError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The X-ray assessment could not be completed.",
        ) from None

    prediction = {
        "predicted_class": result.predicted_class,
        "class_index": result.class_index,
        "confidence": result.confidence,
        "probabilities": result.probabilities,
        "oa_indication": result.oa_indication,
        "interpretation": result.interpretation,
        "note": result.note,
    }

    try:
        document = await create_xray_assessment(
            user_id=owner_id, patient_id=patient_id, prediction=prediction
        )
    except PyMongoError:
        # Report the failure honestly rather than returning a result the caller
        # would believe is stored.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SAVE_FAILED,
        ) from None

    return XrayResponse(
        assessment_id=str(document["_id"]),
        patient_id=patient_id,
        type="xray",
        predicted_class=result.predicted_class,
        class_index=result.class_index,
        confidence=result.confidence,
        probabilities=result.probabilities,
        oa_indication=result.oa_indication,
        interpretation=result.interpretation,
        note=result.note,
        created_at=document["created_at"],
    )


@router.post(
    "/symptoms",
    response_model=SymptomsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record the symptoms questionnaire answers for a patient",
)
async def record_symptoms(
    payload: SymptomsRequest,
    current_user: UserSession = Depends(get_current_user),
) -> SymptomsResponse:
    """Save the answers to the symptoms questionnaire against the selected patient.

    Requires a valid access token (`Authorization: Bearer <access_token>`).

    The answers are **recorded, not interpreted**. Nothing is scored and no OA
    conclusion is derived: the stored document is exactly what the patient
    reported, and the response carries no diagnostic field.

    Order of operations:

    1. the patient id is validated and checked against the signed-in user, so
       answers can never be saved for somebody else's patient
    2. the answers are inserted into the `assessments` collection as a document
       of `type` "symptoms"
    """
    owner_id = _owner_id(current_user)
    patient_id = await _require_owned_patient(payload.patient_id, owner_id)

    # model_dump gives the stored keys and nothing else: no extra field can be
    # smuggled into the document, and no derived field is added.
    answers = payload.symptoms.model_dump()

    try:
        document = await create_symptoms_assessment(
            user_id=owner_id, patient_id=patient_id, symptoms=answers
        )
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=SYMPTOMS_SAVE_FAILED,
        ) from None

    return SymptomsResponse(
        assessment_id=str(document["_id"]),
        patient_id=patient_id,
        symptoms=SymptomsAnswers(**answers),
        created_at=document["created_at"],
    )


@history_router.get(
    "",
    response_model=AssessmentListResponse,
    status_code=status.HTTP_200_OK,
    summary="List the authenticated user's assessments, newest first",
)
async def read_assessments(
    patient_id: Optional[str] = Query(
        default=None,
        description="Limit the history to one patient, for example OA-0001.",
        examples=["OA-0001"],
    ),
    current_user: UserSession = Depends(get_current_user),
) -> AssessmentListResponse:
    """Return saved assessments belonging to the signed-in user.

    - `patient_id` is optional. When given, the patient is verified to belong to
      the caller first and only that patient's assessments are returned.
    - Always filtered on the id from the verified token, so a user can never read
      another user's assessments.
    - Sorted newest first. An account with no assessments gets an empty list.
    """
    owner_id = _owner_id(current_user)

    if patient_id:
        # Verifying ownership here means a user cannot probe another user's
        # patient ids through this endpoint either.
        patient_id = await _require_owned_patient(patient_id, owner_id)

    try:
        documents = await list_assessments_for_user(user_id=owner_id, patient_id=patient_id)
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=DATABASE_UNAVAILABLE,
        ) from None

    assessments: List[AssessmentPublic] = [
        assessment_to_public(document) for document in documents
    ]

    return AssessmentListResponse(assessments=assessments)
