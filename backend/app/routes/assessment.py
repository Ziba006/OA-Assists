"""Assessment routes for OA Assist.

Currently the X-ray assessment only: it runs the trained knee OA model over an
uploaded image and returns the predicted class with the model probabilities.
Nothing is stored: the upload is processed in memory and discarded, and no
assessment is written to MongoDB yet.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from ..dependencies import get_current_user
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


class XrayResponse(BaseModel):
    """Result of one X-ray assessment.

    `probabilities` are the raw softmax outputs of the model, one per class.
    This is a preliminary, AI-assisted result, not a diagnosis.
    """

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


@router.post(
    "/xray",
    response_model=XrayResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess a knee X-ray image",
)
async def assess_xray(
    file: UploadFile = File(..., description="Knee X-ray image (JPG/JPEG or PNG)."),
    current_user: UserSession = Depends(get_current_user),
) -> XrayResponse:
    """Run the trained knee OA model over an uploaded X-ray.

    Requires a valid access token (`Authorization: Bearer <access_token>`).

    The image is validated, converted to grayscale, resized to 224x224, turned
    back into 3 channels and passed through the model. The result is returned
    with the class probabilities; nothing is written to MongoDB and the upload
    is not kept on disk.
    """
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

    return XrayResponse(
        predicted_class=result.predicted_class,
        class_index=result.class_index,
        confidence=result.confidence,
        probabilities=result.probabilities,
        oa_indication=result.oa_indication,
        interpretation=result.interpretation,
        note=result.note,
    )
