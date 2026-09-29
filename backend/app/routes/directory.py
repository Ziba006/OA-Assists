"""Healthcare directory route for OA Assist.

`GET /api/nearby-doctors` answers "what healthcare facilities are near this
place?" using the OpenStreetMap services in `directory_service`. The browser never
talks to Nominatim or Overpass directly: keeping the calls here means the public
endpoints see OA Assist's identifying User-Agent, the short caches in the service
actually apply across users, and no key or endpoint can be tampered with from the
client.

Two ways in, because the page offers two:

- `location` — free text such as an area, a city or a PIN code, geocoded here.
- `latitude` + `longitude` — the point from "Use My Current Location", used as
  given so the browser is never asked to geocode a second time.

**The search location is not stored.** This route reads no patient, writes no
collection and has no model layer at all, so nothing about where a user looked
reaches MongoDB.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..dependencies import get_current_user
from ..models.user import UserSession
from ..services import directory_service
from ..services.directory_service import (
    DEFAULT_RADIUS_M,
    MAX_RADIUS_M,
    MIN_RADIUS_M,
    DirectoryError,
    LocationNotFound,
)

router = APIRouter()

# Returned with the results so the page can be explicit about coverage: OpenStreetMap
# is crowd-sourced, so "nothing found" often means "nothing mapped here", and the
# reader deserves to know that.
DATA_SOURCE = "OpenStreetMap"
DATA_SOURCE_NOTE = (
    "Provider information is sourced from OpenStreetMap and may be incomplete or "
    "outdated. Please verify availability, services, and contact details with the "
    "provider."
)


@router.get(
    "/nearby-doctors",
    tags=["directory"],
    summary="Search OpenStreetMap for healthcare facilities near a location",
)
async def nearby_doctors(
    location: Optional[str] = Query(
        default=None,
        max_length=directory_service.MAX_QUERY_LENGTH,
        description="Area, city, PIN code or address to geocode. Omit when using coordinates.",
    ),
    latitude: Optional[float] = Query(
        default=None,
        ge=-90,
        le=90,
        description="Latitude from the browser's geolocation. Requires longitude too.",
    ),
    longitude: Optional[float] = Query(
        default=None,
        ge=-180,
        le=180,
        description="Longitude from the browser's geolocation. Requires latitude too.",
    ),
    radius: int = Query(
        default=DEFAULT_RADIUS_M,
        ge=MIN_RADIUS_M,
        le=MAX_RADIUS_M,
        description="Search radius in metres.",
    ),
    _user: UserSession = Depends(get_current_user),
) -> dict[str, Any]:
    """Return real nearby healthcare facilities, nearest first.

    `200` with an empty `providers` list means the search worked and nothing was
    mapped nearby. `404` means the submitted text is not a place this backend
    could resolve, which the page shows as "Location not found" rather than as an
    empty result. `400` is a malformed request and `502` means Nominatim or
    Overpass failed. Neither upstream error body is passed through.
    """
    has_coordinates = latitude is not None and longitude is not None

    if (latitude is not None) != (longitude is not None):
        # One coordinate cannot be searched around, and silently treating it as
        # the other half of a pair would produce a wrong location.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Send both a latitude and a longitude, or neither.",
        )

    if not has_coordinates and not location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either a location or a latitude and longitude.",
        )

    try:
        if has_coordinates:
            resolved = directory_service.GeocodedLocation(
                name="your current location",
                latitude=latitude,
                longitude=longitude,
            )
        else:
            resolved = await directory_service.geocode_async(location)
    except LocationNotFound as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
        ) from error
    except DirectoryError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)
        ) from error

    try:
        providers = await directory_service.find_nearby_providers_async(
            latitude=resolved.latitude,
            longitude=resolved.longitude,
            radius_m=radius,
        )
    except DirectoryError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)
        ) from error

    return {
        "location": resolved.as_dict(),
        "radius_m": radius,
        "count": len(providers),
        "providers": [provider.as_dict() for provider in providers],
        "data_source": DATA_SOURCE,
        "data_source_note": DATA_SOURCE_NOTE,
    }
