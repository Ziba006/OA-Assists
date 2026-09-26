"""Password hashing helpers for OA Assist.

Uses the `bcrypt` library directly (no passlib wrapper).

Why the small amount of extra code:
bcrypt can only hash the first 72 bytes of a password and silently ignores
anything after that. To make sure a long password is never partially ignored,
the password is first condensed into a fixed-length SHA-256 digest and then
hashed with bcrypt. The result is a normal bcrypt hash string.
"""

from __future__ import annotations

import base64
import hashlib

import bcrypt

# Cost factor: 12 is a good balance of security and speed for a small app.
# The stored hash includes this value, so it can be raised later without
# breaking existing accounts.
BCRYPT_ROUNDS = 12


def _prepare_password(password: str) -> bytes:
    """Turn any length password into exactly 72 bytes for bcrypt."""
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    """Hash a plain password. Always call this before storing a password."""
    hashed = bcrypt.hashpw(_prepare_password(password), bcrypt.gensalt(rounds=BCRYPT_ROUNDS))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plain password against a stored hash. Returns True/False."""
    if not password_hash:
        return False

    try:
        return bcrypt.checkpw(_prepare_password(plain_password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        # The stored value is not a valid bcrypt hash.
        return False
