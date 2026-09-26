"""FastAPI application entry point for OA Assist.

Run it locally with:

    uvicorn app.main:app --reload

From the ``backend`` folder.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path

from .database import DATABASE_NAME, close_database, ping_database
from .models import ensure_user_indexes
from .routes import auth

# Load backend/.env before reading any configuration values.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Origins allowed to call this API from a browser.
# Default matches the Vite dev server. To change it, set FRONTEND_ORIGINS in
# backend/.env as a comma-separated list, for example:
#   FRONTEND_ORIGINS=http://localhost:5173,https://your-app.vercel.app
DEFAULT_CORS_ORIGINS = ["http://localhost:5173"]


def get_cors_origins() -> list[str]:
    """Build the CORS allow-list from the environment."""
    raw_value = os.getenv("FRONTEND_ORIGINS", "")

    if not raw_value.strip():
        return DEFAULT_CORS_ORIGINS

    origins = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
    return origins or DEFAULT_CORS_ORIGINS


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Open the database on startup and close it cleanly on shutdown."""
    # The MongoDB client is created lazily on first use, so only the user
    # indexes are prepared here. A database problem must not stop the API from
    # starting, so failures are logged and ignored.
    try:
        await ensure_user_indexes()
    except Exception as exc:  # noqa: BLE001 - startup must never crash
        print(f"[startup] user indexes not created: {type(exc).__name__}")

    yield
    await close_database()


app = FastAPI(
    title="OA Assist API",
    description="Backend for the OA Assist osteoarthritis assessment platform.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes. Currently only POST /api/auth/signup exists.
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.get("/", tags=["general"])
async def root() -> dict[str, str]:
    """Simple welcome endpoint used to confirm the API is running."""
    return {"message": "OA Assist backend is running"}


@app.get("/health", tags=["general"])
async def health() -> JSONResponse:
    """Report API health and whether MongoDB is reachable.

    Returns HTTP 200 when the database answers a ping and HTTP 503 when it does
    not, so a hosting platform can detect an unhealthy deployment.
    """
    database_reachable = await ping_database()

    return JSONResponse(
        status_code=status.HTTP_200_OK if database_reachable else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "ok" if database_reachable else "degraded",
            "service": "oa-assist-backend",
            "database": {
                "name": DATABASE_NAME,
                "reachable": database_reachable,
            },
        },
    )
