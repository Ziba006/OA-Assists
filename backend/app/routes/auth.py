"""Authentication routes for OA Assist.

Only signup exists right now. Login, tokens and session handling are not
implemented yet.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, Field

from ..models.user import UserCreate, UserPublic, get_users_collection, utc_now
from ..utils.security import hash_password

router = APIRouter()


class SignupResponse(BaseModel):
    """Shape returned after a successful signup. The password is never included."""

    message: str = Field(..., examples=["Account created successfully"])
    user: UserPublic


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new OA Assist account",
)
async def signup(payload: UserCreate) -> SignupResponse:
    """Register a new user.

    - The email is normalized to lowercase before it is stored.
    - The password is hashed with bcrypt; the plain text is never stored.
    - Returns 409 if the email is already registered.
    """
    users = get_users_collection()

    # 1. Reject an email that is already registered.
    existing_user = await users.find_one({"email": payload.email}, {"_id": 1})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 2. Never store the plain password: hash it first.
    document = {
        "fullName": payload.fullName,
        "email": payload.email,
        "password": hash_password(payload.password),
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
    }

    # 3. Insert the user.
    try:
        result = await users.insert_one(document)
    except DuplicateKeyError:
        # Two signups with the same email at the same time: the unique index
        # caught it, so report the same clear error.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    # 4. Return the safe user shape (no password, no hash).
    return SignupResponse(
        message="Account created successfully",
        user=UserPublic(
            id=str(result.inserted_id),
            fullName=document["fullName"],
            email=document["email"],
            createdAt=document["createdAt"],
            updatedAt=document["updatedAt"],
        ),
    )
