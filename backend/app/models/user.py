"""User model/schema for OA Assist.

The schema is plain Pydantic v2 plus a small collection helper, so it works
directly with the existing PyMongo async connection in `app.database`.

Important: `password` is currently a plain string. Hashing (for example with
bcrypt or argon2) must happen before any document is written to MongoDB, and
that belongs in the signup flow, which is not implemented yet.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from ..database import get_database

# Name of the MongoDB collection that stores users.
USERS_COLLECTION = "users"


def utc_now() -> datetime:
    """Return the current time in UTC (MongoDB stores dates in UTC)."""
    return datetime.now(timezone.utc)


def normalize_email(email: str) -> str:
    """Normalize an email address so the same person cannot sign up twice.

    Emails are stored lowercase and without surrounding spaces, which makes the
    unique index on `email` reliable.
    """
    return email.strip().lower()


def get_users_collection():
    """Return the async `users` collection from the OA Assist database."""
    return get_database()[USERS_COLLECTION]


class UserCreate(BaseModel):
    """Data accepted when creating a user (used by the future signup route)."""

    fullName: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Full name of the user.",
        examples=["Aarav Sharma"],
    )
    email: EmailStr = Field(
        ...,
        description="Contact email, stored lowercase and trimmed.",
        examples=["aarav@example.com"],
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Plain password for now. Hash it before storing.",
    )

    @field_validator("fullName")
    @classmethod
    def clean_full_name(cls, value: str) -> str:
        """Trim extra spaces and reject names that are only whitespace."""
        cleaned = " ".join(value.split())

        if not cleaned:
            raise ValueError("Full name is required.")

        return cleaned

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: EmailStr) -> str:
        return normalize_email(str(value))


class UserInDB(BaseModel):
    """A user document as stored in MongoDB."""

    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    fullName: str
    email: str
    # TODO: replace with a hash (bcrypt/argon2) once the signup route exists.
    password: str
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)


class UserLogin(BaseModel):
    """Credentials accepted by the login route.

    The email is normalized the same way as on signup, so a user can log in with
    any casing or surrounding spaces. The password is only checked against the
    stored hash and is never stored here.
    """

    email: EmailStr = Field(
        ...,
        description="Email of the account, matched lowercase and trimmed.",
        examples=["zibatest@example.com"],
    )
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Plain password, verified against the stored bcrypt hash.",
        examples=["TestPassword123"],
    )

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: EmailStr) -> str:
        return normalize_email(str(value))


class UserSession(BaseModel):
    """Safe shape of the signed-in user.

    Deliberately smaller than `UserPublic`: a login response only needs the
    identity, and the password is never part of any response model.
    """

    id: str
    fullName: str
    email: str


class UserPublic(BaseModel):
    """Safe shape of a user for API responses (never includes the password)."""

    id: Optional[str] = None
    fullName: str
    email: str
    createdAt: datetime
    updatedAt: datetime


async def ensure_user_indexes() -> None:
    """Create the indexes the users collection relies on.

    Safe to call more than once: MongoDB only creates an index if it is
    missing. The unique index on the normalized email is what guarantees one
    account per email address.
    """
    collection = get_users_collection()
    await collection.create_index("email", unique=True, name="uniq_email")
