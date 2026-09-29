"""MongoDB connection handling for OA Assist.

This module is the single place that knows how to reach MongoDB. Everything
else in the backend imports the helpers from here, so the connection can be
changed in one spot.

Design notes:
- The connection string is read from the MONGO_URI environment variable, which
  is loaded from ``backend/.env``. Never hardcode credentials in code.
- PyMongo's async client is used directly (Motor is deprecated), so FastAPI
  handlers can await database calls without blocking the event loop.
- The client is created lazily and reused for the lifetime of the process.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError

# backend/.env lives one level above this file (backend/app/database.py)
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)

# Name of the database inside the MongoDB cluster.
DATABASE_NAME = "oa_assist"

# Fail fast instead of hanging if the cluster cannot be reached.
SERVER_SELECTION_TIMEOUT_MS = 5000

# Created on first use and reused afterwards.
_client: AsyncMongoClient | None = None


def get_mongo_uri() -> str:
    """Return the MongoDB connection string from the environment.

    Raises:
        RuntimeError: if MONGO_URI is missing or empty.
    """
    uri = os.getenv("MONGO_URI", "").strip()

    if not uri:
        raise RuntimeError(
            "MONGO_URI is not set. Copy backend/.env.example to backend/.env "
            "and add your MongoDB Atlas connection string."
        )

    return uri


def get_client() -> AsyncMongoClient:
    """Return the shared async MongoClient, creating it on first use."""
    global _client

    if _client is None:
        _client = AsyncMongoClient(
            get_mongo_uri(),
            serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS,
            uuidRepresentation="standard",
            # MongoDB stores every date in UTC but hands it back as a naive
            # datetime by default, so a response would be serialized without a
            # timezone and every client would read it as its own local time. A
            # stored "today" then appears on the wrong day. Asking for aware
            # datetimes makes the API emit an explicit UTC offset, which is the
            # only way a browser can place a record on the right date.
            tz_aware=True,
        )

    return _client


def get_database():
    """Return the OA Assist database handle used by future routes and models."""
    return get_client()[DATABASE_NAME]


async def ping_database() -> bool:
    """Return True when MongoDB answers a ping, False when it cannot be reached."""
    try:
        await get_client().admin.command("ping")
    except (PyMongoError, RuntimeError, OSError):
        # A missing URI or an unreachable cluster should not crash the API.
        return False

    return True


async def close_database() -> None:
    """Close the shared client. Called when the FastAPI app shuts down."""
    global _client

    if _client is not None:
        await _client.close()
        _client = None
