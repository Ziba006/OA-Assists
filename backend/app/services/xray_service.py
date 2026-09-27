"""Knee X-ray inference for OA Assist.

Wraps the trained EfficientNetB0 classifier saved at
`app/models/best_knee_finetuned_v2.keras`. The model is never retrained or
modified here: it is loaded once, cached in memory, and reused for every request.

Loading notes
-------------
The model was saved with a custom training loss, so `load_model` needs the
`loss_fn` name to resolve. `focal_loss` below provides that name. The loss is
only needed so Keras can rebuild the model object; it is never used for
inference, and no training happens in the API.

Preprocessing
-------------
Exactly the steps used at training time:

1. open the image and convert it to grayscale ("L")
2. resize to the model input size (224 x 224)
3. convert back to 3 channels ("RGB")
4. add the batch dimension
5. `model.predict(...)`
6. `argmax` over the 4 outputs

No other normalisation, cropping or augmentation is applied, because that would
change the input distribution the model was trained on.
"""

from __future__ import annotations

import io
import threading
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

# Model input size, taken from the saved model: InputLayer [None, 224, 224, 3].
IMG_SIZE = 224

# Class order of the trained model, index 0 to 3.
CLASS_NAMES: tuple[str, ...] = ("Healthy", "Minimal", "Moderate", "Severe")

# Path of the trained model, next to this package: app/models/*.keras
MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "best_knee_finetuned_v2.keras"

# Image formats the endpoint accepts.
SUPPORTED_CONTENT_TYPES: frozenset[str] = frozenset(
    {"image/jpeg", "image/jpg", "image/png", "image/pjpeg"}
)
SUPPORTED_SUFFIXES: frozenset[str] = frozenset({".jpg", ".jpeg", ".png"})

# Upper bound for an upload. 10 MB is far above a knee X-ray.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

# Wording for each class. Nothing here states a diagnosis.
_INTERPRETATIONS: dict[str, str] = {
    "Healthy": "No OA-associated changes indicated by the model.",
    "Minimal": "Mild OA-associated changes indicated.",
    "Moderate": "Moderate OA-associated changes indicated.",
    "Severe": "Severe OA-associated changes indicated.",
}

DISCLAIMER = (
    "This is an AI-assisted preliminary assessment and is not a medical diagnosis."
)

# Set when only the Healthy class means "no OA-associated changes indicated".
_HEALTHY_CLASS = "Healthy"


class XrayServiceError(Exception):
    """Base class for every error raised by this service."""


class ModelUnavailableError(XrayServiceError):
    """The trained model could not be loaded."""


class InvalidImageError(XrayServiceError):
    """The upload is not a readable image in a supported format."""


class InferenceError(XrayServiceError):
    """The model was loaded but the prediction failed."""


def focal_loss(y_true, y_pred, gamma: float = 2.0, alpha: float = 0.25):
    """Categorical focal loss.

    Present only so the saved model, whose training loss was serialized under
    the name `loss_fn`, can be deserialized by `tf.keras.models.load_model`.
    The API never trains, so this is never called during inference.
    """
    import tensorflow as tf

    y_pred = tf.convert_to_tensor(y_pred, dtype=tf.float32)
    y_true = tf.cast(tf.convert_to_tensor(y_true), y_pred.dtype)

    # Accept integer class labels as well as one-hot labels.
    if y_pred.shape[-1] is not None and y_pred.shape[-1] > 1:
        if y_true.shape[-1] is None or y_true.shape[-1] != y_pred.shape[-1]:
            y_true = tf.one_hot(
                tf.cast(tf.squeeze(y_true, axis=-1), tf.int32),
                depth=y_pred.shape[-1],
                dtype=y_pred.dtype,
            )

    y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0)
    cross_entropy = -tf.reduce_sum(y_true * tf.math.log(y_pred), axis=-1)
    p_t = tf.reduce_sum(y_true * y_pred, axis=-1)
    alpha_t = y_true * alpha + (1.0 - y_true) * (1.0 - alpha)
    loss = alpha_t * tf.pow(1.0 - p_t, gamma) * cross_entropy

    return tf.reduce_mean(loss)


# The model is cached here instead of being reloaded from disk per request.
_model = None
_model_lock = threading.Lock()


def get_model():
    """Return the trained model, loading it once and caching it in memory.

    Raises:
        ModelUnavailableError: if TensorFlow or the weights cannot be loaded.
    """
    global _model

    if _model is not None:
        return _model

    # The lock keeps a burst of first requests from loading the file several
    # times at once.
    with _model_lock:
        if _model is not None:
            return _model

        if not MODEL_PATH.exists():
            raise ModelUnavailableError("The X-ray model file is not available on the server.")

        try:
            import tensorflow as tf
        except ImportError as exc:  # pragma: no cover - dependency is declared
            raise ModelUnavailableError(
                "The X-ray service dependencies are not installed on the server."
            ) from exc

        try:
            # compile=False: inference never needs the optimizer or the loss, so
            # nothing has to be rebuilt on load.
            _model = tf.keras.models.load_model(
                str(MODEL_PATH),
                custom_objects={"loss_fn": focal_loss},
                compile=False,
            )
        except Exception as exc:  # noqa: BLE001 - never leak the traceback
            raise ModelUnavailableError("The X-ray model could not be loaded.") from exc

    return _model


def is_model_loaded() -> bool:
    """True once the model is in memory. Used for diagnostics only."""
    return _model is not None


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Turn an uploaded image into the model input batch.

    Follows the training-time steps exactly: grayscale, resize to 224x224, back
    to 3 channels, then the batch dimension.

    Raises:
        InvalidImageError: if the bytes are not a readable image.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            grayscale = image.convert("L")
            resized = grayscale.resize((IMG_SIZE, IMG_SIZE))
            rgb = resized.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise InvalidImageError("The uploaded file could not be read as an image.") from exc

    array = np.asarray(rgb, dtype=np.float32)

    # Batch dimension: (224, 224, 3) -> (1, 224, 224, 3).
    return np.expand_dims(array, axis=0)


@dataclass(frozen=True)
class XrayPrediction:
    """Result of one inference. Contains no server paths and no file contents."""

    predicted_class: str
    class_index: int
    confidence: float
    probabilities: dict[str, float]
    oa_indication: bool
    interpretation: str
    note: str = DISCLAIMER


def predict(image_bytes: bytes) -> XrayPrediction:
    """Run inference on an uploaded image.

    Raises:
        InvalidImageError: the upload is not a readable image.
        ModelUnavailableError: the model could not be loaded.
        InferenceError: the prediction itself failed.
    """
    model = get_model()
    batch = preprocess_image(image_bytes)

    try:
        raw = model.predict(batch, verbose=0)
    except Exception as exc:  # noqa: BLE001 - never leak the traceback
        raise InferenceError("The X-ray assessment could not be completed.") from exc

    try:
        scores = np.asarray(raw, dtype=np.float64).reshape(-1)
    except (TypeError, ValueError) as exc:
        raise InferenceError("The X-ray assessment returned an unexpected result.") from exc

    if scores.size != len(CLASS_NAMES):
        raise InferenceError("The X-ray assessment returned an unexpected result.")

    class_index = int(np.argmax(scores))
    predicted_class = CLASS_NAMES[class_index]

    # The last layer is a softmax, so these are model probabilities.
    probabilities = {
        name: round(float(score), 6) for name, score in zip(CLASS_NAMES, scores, strict=True)
    }

    return XrayPrediction(
        predicted_class=predicted_class,
        class_index=class_index,
        confidence=round(float(scores[class_index]), 6),
        probabilities=probabilities,
        oa_indication=predicted_class != _HEALTHY_CLASS,
        interpretation=_INTERPRETATIONS[predicted_class],
    )


def describe_model() -> dict[str, object]:
    """Small summary of the loaded model, for diagnostics and tests."""
    model = get_model()

    return {
        "input_shapes": [tuple(layer.shape) for layer in model.inputs],
        "classes": list(CLASS_NAMES),
        "img_size": IMG_SIZE,
    }
