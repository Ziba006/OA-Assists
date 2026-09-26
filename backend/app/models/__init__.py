"""MongoDB document models for OA Assist."""

from .user import (
    USERS_COLLECTION,
    UserCreate,
    UserInDB,
    UserPublic,
    ensure_user_indexes,
    get_users_collection,
    normalize_email,
    utc_now,
)

__all__ = [
    "USERS_COLLECTION",
    "UserCreate",
    "UserInDB",
    "UserPublic",
    "ensure_user_indexes",
    "get_users_collection",
    "normalize_email",
    "utc_now",
]
