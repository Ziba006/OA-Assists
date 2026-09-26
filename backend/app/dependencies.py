"""Reusable FastAPI dependencies for OA Assist.

`get_current_user` is the single place that turns an `Authorization: Bearer <jwt>`
header into a real user. Every protected route depends on it, so token handling
is never written twice.

The user is always re-read from MongoDB using the id in the token. Nothing the
client sends is trusted, and the password never leaves the database.
"""

from __future__ import annotations

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import PyMongoError

from .models.user import UserSession, get_users_collection
from .utils.jwt_utils import JWTError, decode_access_token

# auto_error=False so a missing header produces our own clear 401 message
# instead of FastAPI's generic "Not authenticated" error.
bearer_scheme = HTTPBearer(auto_error=False, description="JWT access token from /api/auth/login.")

# One message for a missing, malformed, expired or unknown token, so the
# response does not reveal which part failed.
INVALID_TOKEN_MESSAGE = "Could not validate credentials."


def _to_object_id(value: str) -> ObjectId:
    """Convert a token's `sub` claim to an ObjectId.

    Raises:
        HTTPException: 401 if the claim is not a valid id, which also means the
            token was not issued by this application.
    """
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_TOKEN_MESSAGE,
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserSession:
    """Return the authenticated user described by the Bearer token.

    Raises:
        HTTPException: 401 when the Authorization header is missing, the token
            is invalid or expired, or the account no longer exists. 503 when the
            database cannot be reached.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=INVALID_TOKEN_MESSAGE,
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None or not credentials.credentials:
        raise unauthorized

    try:
        claims = decode_access_token(credentials.credentials)
    except JWTError:
        raise unauthorized from None

    user_id = claims.get("sub")
    if not user_id:
        raise unauthorized

    # Trust only the id from the verified token, then read the current details
    # from the database, so a change to the account shows up immediately.
    try:
        user = await get_users_collection().find_one({"_id": _to_object_id(user_id)})
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The database is currently unavailable.",
        ) from None

    if user is None:
        # The token itself is fine, but the account behind it is gone.
        raise unauthorized

    return UserSession(
        id=str(user["_id"]),
        fullName=user["fullName"],
        email=user["email"],
    )
