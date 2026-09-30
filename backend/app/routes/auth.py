"""Authentication routes for OA Assist.

Signup, login and reading the signed-in user exist now, together with the two
self-service account actions: updating your own profile and changing your own
password. Both act only on the account behind the presented JWT. Tokens, server
side sessions and password resets are not implemented yet.
"""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError
from pydantic import BaseModel, Field

from ..dependencies import get_current_user
from ..models.user import (
    PasswordChangeRequest,
    UserCreate,
    UserLogin,
    UserProfileUpdate,
    UserPublic,
    UserSession,
    get_users_collection,
    utc_now,
)
from ..utils.jwt_utils import create_access_token
from ..utils.security import hash_password, verify_password

router = APIRouter()

# One message for every failed login, so the response never reveals whether an
# account exists. Returned with HTTP 401 for an unknown email and for a wrong
# password alike.
INVALID_CREDENTIALS = "Incorrect email or password."

# A valid bcrypt hash of a value nobody knows. When no account matches the
# email, the password is still verified against this hash so the two failure
# paths take the same amount of time and cannot be told apart by timing.
DUMMY_PASSWORD_HASH = "$2b$12$Nctc1TjFJUVHRFKAXOuPCuTt/l0IhjSvfD8qISfM29TokUnrC1dXa"


class SignupResponse(BaseModel):
    """Shape returned after a successful signup. The password is never included."""

    message: str = Field(..., examples=["Account created successfully"])
    user: UserPublic


class LoginResponse(BaseModel):
    """Shape returned after a successful login.

    Carries a signed JWT access token. The password, its hash and the signing
    secret are never part of the response.
    """

    message: str = Field(..., examples=["Login successful"])
    user: UserSession
    access_token: str = Field(
        ...,
        description="Signed JWT. Send it as: Authorization: Bearer <access_token>",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
    )
    token_type: str = Field(default="bearer", examples=["bearer"])


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


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Log in with an email and password",
)
async def login(payload: UserLogin) -> LoginResponse:
    """Verify credentials and return the signed-in user with a JWT.

    - The email is matched lowercase and trimmed, exactly as it is stored.
    - The password is only ever compared against the stored bcrypt hash.
    - An unknown email and a wrong password both return the same `401` response,
      so the endpoint does not reveal which accounts exist.
    - On success a stateless JWT is returned. Send it back as
      `Authorization: Bearer <access_token>` to call protected routes such as
      `GET /api/auth/me`. The token is not stored in MongoDB.
    """
    users = get_users_collection()

    # 1. Look the account up by the normalized email.
    user = await users.find_one({"email": payload.email})

    # 2. Verify the password, even when there is no account, so both failure
    #    paths cost the same and the timing does not leak account existence.
    password_hash = user["password"] if user else DUMMY_PASSWORD_HASH
    password_matches = verify_password(payload.password, password_hash)

    if user is None or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
        )

    # 3. Sign a token that carries only the id and the email of the user.
    user_id = str(user["_id"])
    access_token = create_access_token(user_id=user_id, email=user["email"])

    # 4. Return the identity and the token. The password and its hash stay in
    #    MongoDB.
    return LoginResponse(
        message="Login successful",
        user=UserSession(
            id=user_id,
            fullName=user["fullName"],
            email=user["email"],
        ),
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserSession,
    status_code=status.HTTP_200_OK,
    summary="Return the currently authenticated user",
)
async def read_current_user(current_user: UserSession = Depends(get_current_user)) -> UserSession:
    """Protected route: requires `Authorization: Bearer <access_token>`.

    The response is built from the MongoDB document found with the id inside the
    verified token, so nothing the client sends is trusted. The password and its
    hash are never returned.
    """
    return current_user


@router.patch(
    "/me",
    response_model=UserSession,
    status_code=status.HTTP_200_OK,
    summary="Update the currently authenticated user's own profile",
)
async def update_current_user(
    payload: UserProfileUpdate,
    current_user: UserSession = Depends(get_current_user),
) -> UserSession:
    """Protected route: changes only the account behind the presented token.

    Which user is being changed comes entirely from the verified JWT. There is
    no id in the request body or the path, so one account cannot edit another:
    there is simply nothing to point it at.

    Only the name is writable. The email is not accepted here at all, so a
    caller cannot attempt to move an account to an address it does not control.

    The response is the same safe `UserSession` shape as `GET /api/auth/me`, so
    the client learns the new name without the password or its hash ever being
    serialised.
    """
    users = get_users_collection()

    try:
        updated = await users.find_one_and_update(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"fullName": payload.fullName, "updatedAt": utc_now()}},
            return_document=ReturnDocument.AFTER,
        )
    except (DuplicateKeyError, PyMongoError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The profile could not be saved right now. Please try again.",
        ) from error

    if updated is None:
        # The token was valid but the account has since been removed.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserSession(
        id=current_user.id,
        fullName=updated["fullName"],
        email=updated["email"],
    )


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change the currently authenticated user's password",
)
async def change_password(
    payload: PasswordChangeRequest,
    current_user: UserSession = Depends(get_current_user),
) -> dict:
    """Protected route: changes only the password of the account behind the token.

    The current password is verified against the stored bcrypt hash, so an
    unlocked session on its own is not enough to take the account over.

    **Status codes.** A wrong current password returns `400`, not `401`. On this
    API a `401` means "this token is not usable" and the client reacts to it by
    clearing the session and sending the person to the login page. A mistyped
    password is not that: the session is still perfectly valid, so answering
    `401` would log somebody out for a typo. `400` with a clear message reports
    the failure without touching the session.

    The plain passwords are used only inside this function: one to verify, one
    to hash. Neither is written anywhere, logged, or returned, and the stored
    hash is replaced rather than accumulated.

    The JWT is stateless and carries only the account id and email, so it is
    not invalidated by this change. The client signs out after a successful
    change anyway, which is the safer default; see the Profile page.
    """
    users = get_users_collection()

    user = await users.find_one({"_id": ObjectId(current_user.id)}, {"password": 1})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.current_password, user.get("password", "")):
        # Deliberately says nothing else about the account, and gives no hint
        # about the new password either.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    await users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"password": hash_password(payload.new_password), "updatedAt": utc_now()}},
    )

    return {"message": "Password changed successfully."}
