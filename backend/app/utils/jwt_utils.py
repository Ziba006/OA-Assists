"""JWT creation and verification for OA Assist.

Configuration comes from the environment, never from the source code:

- ``JWT_SECRET``        signing key (required, no default; must live in .env)
- ``JWT_ALGORITHM``     signing algorithm, defaults to ``HS256``
- ``JWT_EXPIRE_MINUTES`` token lifetime in minutes, defaults to ``60``

The tokens are stateless: nothing is written to MongoDB. Signing out (and
revoking a token before it expires) is therefore not supported yet — a
dedicated revocation list or shorter expiry would be the next step.

Only the user's id and email are put in the payload. The password and its hash
are never part of a token.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import jwt
from dotenv import load_dotenv

# backend/.env lives one level above the app package (backend/app/utils/jwt_utils.py)
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# Fallbacks for the two values that are safe to default. The secret has none.
DEFAULT_ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 60


class JWTError(Exception):
    """Raised when a token is missing, malformed, expired or has a bad signature."""


def get_jwt_secret() -> str:
    """Return the signing secret from the environment.

    Raises:
        RuntimeError: if JWT_SECRET is missing or empty, so the app can never
            start with a hardcoded or blank signing key.
    """
    secret = os.getenv("JWT_SECRET", "").strip()

    if not secret:
        raise RuntimeError(
            "JWT_SECRET is not set. Add it to backend/.env (see .env.example) "
            "or set it as an environment variable on the host."
        )

    return secret


def get_jwt_algorithm() -> str:
    """Return the signing algorithm, HS256 unless JWT_ALGORITHM says otherwise."""
    return os.getenv("JWT_ALGORITHM", "").strip() or DEFAULT_ALGORITHM


def get_expire_minutes() -> int:
    """Return the token lifetime in minutes, 60 unless JWT_EXPIRE_MINUTES says otherwise."""
    raw_value = os.getenv("JWT_EXPIRE_MINUTES", "").strip()

    if not raw_value:
        return DEFAULT_EXPIRE_MINUTES

    try:
        minutes = int(raw_value)
    except ValueError:
        return DEFAULT_EXPIRE_MINUTES

    return minutes if minutes > 0 else DEFAULT_EXPIRE_MINUTES


def create_access_token(
    *,
    user_id: str,
    email: str,
    expires_minutes: Optional[int] = None,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    """Create a signed access token for a user.

    The payload carries only the subject (the user id) and the email. The
    password and its hash are never included.

    Args:
        user_id: the MongoDB ``_id`` of the user, stored as the ``sub`` claim.
        email: the normalized email address of the user.
        expires_minutes: overrides JWT_EXPIRE_MINUTES (used by tests).
        extra_claims: additional claims, merged last.

    Returns:
        The encoded, signed token.
    """
    now = datetime.now(timezone.utc)
    lifetime = expires_minutes if expires_minutes is not None else get_expire_minutes()

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=lifetime)).timestamp()),
        # Lets a future version tell old tokens apart.
        "typ": "access",
    }

    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, get_jwt_secret(), algorithm=get_jwt_algorithm())


def decode_access_token(token: str) -> dict[str, Any]:
    """Verify a token and return its claims.

    The signature, the expiry and the algorithm are all checked.

    Raises:
        JWTError: if the token is invalid, expired or signed with another key.
    """
    if not token or not token.strip():
        raise JWTError("Token is missing.")

    try:
        return jwt.decode(
            token.strip(),
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise JWTError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise JWTError("Token is invalid.") from exc
