"""Healthcare directory search for OA Assist, backed by OpenStreetMap.

This module answers one question: *which real healthcare facilities are near a
given point?* It combines two public OpenStreetMap services:

- **Nominatim** turns free text ("Santacruz East", "400055", "Mumbai") into a
  latitude and longitude.
- **Overpass API** returns the OpenStreetMap objects around that point, which
  are filtered down to doctors, clinics and hospitals.

No Google service, API key or payment method is involved. Both services are
public and rate limited, so this module is careful about them:

- requests identify OA Assist with a real `User-Agent`, as Nominatim's usage
  policy requires;
- geocoding is only ever called once per submitted search, never per keystroke,
  and identical recent lookups are answered from a short in-process cache;
- Overpass results are cached the same way, so repeating a search does not
  spend another slot on a public resource.

**This is a directory, not a recommendation engine.** Providers are never ranked
by quality, and nothing here interprets a result medically. A specialty is only
reported when OpenStreetMap itself carries evidence of it, and coverage varies by
place, so the API says so in its own response.

Nothing in this module writes to MongoDB. A search location is used to answer
one request and is not stored anywhere.
"""

from __future__ import annotations

import asyncio
import json
import math
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Iterable, Optional

# Public OpenStreetMap endpoints.
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Public Overpass instances, tried in order. The `lz4` host is a separate backend
# from the main one and normally answers while the main one is busy, which
# matters because a single instance goes quiet for minutes at a time. All three
# serve the same OpenStreetMap data and none of them needs a key.
OVERPASS_URLS = (
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)

# Nominatim's usage policy requires an identifying User-Agent with contact
# details. Change this to something that identifies the real deployment before
# running this publicly at scale.
USER_AGENT = "OA-Assist/1.0 (healthcare directory; https://github.com/oa-assist)"

# The same identifying details, as Nominatim's `email` parameter.
CONTACT_EMAIL = "support@example.com"

DEFAULT_RADIUS_M = 5000
MIN_RADIUS_M = 250
# Overpass's public instances time out on wide scans around a dense city, so the
# cap is what the public service can actually answer reliably. Verified against
# overpass-api.de: 5 km and 10 km answer in seconds, 15 km and beyond frequently
# return a gateway timeout.
MAX_RADIUS_M = 10_000
MAX_RESULTS = 15
# Overpass is asked for more rows than are shown, because the nearest-first list
# is produced here, from data Overpass returns in no particular order.
OVERPASS_ELEMENT_LIMIT = 300
# If the first Overpass instance has already used this much of the request, the
# search gives up rather than queueing behind a second instance as well.
OVERPASS_FALLBACK_BUDGET_S = 10
# The proxy in front of the public instances gives up in about ten seconds, so a
# busy instance fails fast here and the next one is tried, instead of the person
# waiting out a full socket timeout.
REQUEST_TIMEOUT_S = 25

# Nominatim's usage policy allows at most one request per second. Geocoding is
# throttled to that rate across the whole process, so adding users cannot turn
# this backend into a source of abuse.
GEOCODE_MIN_INTERVAL_S = 1.05

# A bare six-digit PIN code is only meaningful with a country: Nominatim ranks
# 400055 in Volgograd above the same code in Mumbai. The app asks for PIN codes
# in the Indian market, so a bare PIN is looked up as an Indian postcode and only
# then as free text, which is what happens for every other query. Change this if
# the app is opened to another market.
DEFAULT_PIN_COUNTRY = "India"
PIN_CODE_PATTERN = re.compile(r"^\d{6}$")

# How long a geocode or an Overpass answer may be reused, in seconds. Short
# enough that a stale map never lingers, long enough that a double click or a
# back-and-forth does not hit the public services again.
GEOCODE_CACHE_TTL_S = 300
SEARCH_CACHE_TTL_S = 300

# Hard cap on free text, so a very long string cannot be forwarded upstream.
MAX_QUERY_LENGTH = 120

EARTH_RADIUS_M = 6_371_000

# Facility categories this directory is for. A provider is only listed when
# OpenStreetMap tags it as one of these.
AMENITY_VALUES = ("doctors", "clinic", "hospital")
HEALTHCARE_VALUES = ("doctor", "clinic", "hospital", "centre")

# What each tag combination means to a reader, so a card can say something
# honest even when the facility has no name.
CATEGORY_LABELS = {
    "doctors": "Doctor office",
    "clinic": "Clinic",
    "hospital": "Hospital",
    "pharmacy": "Pharmacy",
}

# Speciality tags that indicate an orthopedic facility. Only these are used to
# claim a specialty: the directory never infers one from a name or a category.
ORTHOPEDIC_SPECIALITY_VALUES = (
    "orthopaedic",
    "orthopedic",
    "orthopaedics",
    "orthopedics",
)

# A 503 from either upstream is reported as a service problem rather than an
# empty result, so the UI can say "try again" instead of "nothing found".
UPSTREAM_ERROR = "The healthcare directory service is temporarily unavailable."
LOCATION_NOT_FOUND = "That location could not be found."


class DirectoryError(Exception):
    """An upstream directory service failed or answered unusably."""


class LocationNotFound(DirectoryError):
    """Nominatim had no match for the text that was submitted."""


@dataclass
class GeocodedLocation:
    """A place Nominatim resolved, and the point to search around."""

    name: str
    latitude: float
    longitude: float

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }


@dataclass
class Provider:
    """One healthcare facility, built only from what OpenStreetMap records.

    Every optional field is `None` when the source has no value for it, and the
    API omits those fields entirely rather than filling them in.
    """

    name: Optional[str]
    category: str
    address: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    latitude: float
    longitude: float
    distance_m: float
    is_orthopedic: bool = False

    def as_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "name": self.name,
            "category": self.category,
            "latitude": round(self.latitude, 6),
            "longitude": round(self.longitude, 6),
            "distance_m": round(self.distance_m),
            "is_orthopedic": self.is_orthopedic,
        }

        # Omit anything OpenStreetMap does not actually have, rather than
        # sending a null the client would have to guess about.
        if self.address:
            payload["address"] = self.address
        if self.phone:
            payload["phone"] = self.phone
        if self.website:
            payload["website"] = self.website

        return payload


# A tiny TTL cache. Two locks, because an Overpass answer is expensive and
# several requests may be in flight for different places at the same time.
_cache_lock = threading.Lock()
_search_locks: dict[str, threading.Lock] = {}
_geocode_cache: dict[str, tuple[float, GeocodedLocation]] = {}
_search_cache: dict[str, tuple[float, list[Provider]]] = {}

# Held across each geocode, so Nominatim sees at most one request per second no
# matter how many users search at once.
_geocode_lock = threading.Lock()
_last_geocode_at = 0.0


def _cache_get(cache: dict, key: str, ttl_s: int) -> Optional[Any]:
    with _cache_lock:
        entry = cache.get(key)

        if entry is None:
            return None

        stored_at, value = entry

        if time.monotonic() - stored_at > ttl_s:
            del cache[key]
            return None

        return value


def _cache_put(cache: dict, key: str, value: Any) -> None:
    with _cache_lock:
        cache[key] = (time.monotonic(), value)


def _lock_for(key: str) -> threading.Lock:
    """One lock per search key, so identical concurrent searches share a call."""
    with _cache_lock:
        lock = _search_locks.get(key)

        if lock is None:
            lock = threading.Lock()
            _search_locks[key] = lock

        return lock


def _fetch_json(url: str, params: dict[str, str], *, post: bool = False) -> Any:
    """Call an OSM endpoint with an identifying User-Agent and parse the JSON.

    Uses the standard library so the project gains no HTTP dependency, and runs
    in a worker thread because the standard library is blocking. The decoded
    body is returned as-is; each caller checks the shape it expects, because the
    two services disagree (Nominatim answers with a list, Overpass with an
    object).
    """
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }

    data = None
    target = url

    if post:
        # Overpass takes the query as a form-encoded body, which avoids putting
        # a long query in a URL.
        data = urllib.parse.urlencode({"data": params["data"]}).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    else:
        target = f"{url}?{urllib.parse.urlencode(params)}"

    request = urllib.request.Request(target, data=data, headers=headers)

    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        raise DirectoryError(UPSTREAM_ERROR) from error
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise DirectoryError(UPSTREAM_ERROR) from error

    try:
        return json.loads(payload)
    except json.JSONDecodeError as error:
        raise DirectoryError(UPSTREAM_ERROR) from error


# Nominatim answers an area name with everything it can match, from the suburb
# down to a single building or the road it sits on. For a directory the place is
# the right answer: searching "Andheri East" from inside one apartment block
# would point the user at the wrong place. So these address levels win, and a
# structure is only used when nothing better came back.
_PLACE_ADDRESS_TYPES = {
    "borough",
    "city",
    "city_district",
    "county",
    "district",
    "island",
    "locality",
    "municipality",
    "neighbourhood",
    "postcode",
    "postcode_district",
    "quarter",
    "region",
    "state",
    "suburb",
    "suburb_distrct",
    "town",
    "township",
    "village",
}
# Levels that are a single object rather than a place someone can search around.
_STRUCTURE_ADDRESS_TYPES = {
    "address",
    "aeroway",
    "amenity",
    "building",
    "bridge",
    "farm",
    "footway",
    "highway",
    "house",
    "house_number",
    "isolated_dwelling",
    "leisure",
    "place",
    "road",
    "shop",
    "tourism",
    "tunnel",
    "waterway",
}


def _candidate_score(candidate: dict[str, Any]) -> tuple[int, float]:
    """Rank a Nominatim candidate: broad places first, then by importance.

    Nominatim's own ordering already puts a good match first, so importance only
    breaks ties within a tier. The tiers matter more: a school shares its name
    with the area it stands in, and would otherwise win on a closer match.
    """
    address_type = str(candidate.get("addresstype") or "").lower()

    try:
        importance = float(candidate.get("importance") or 0.0)
    except (TypeError, ValueError):
        importance = 0.0

    if address_type in _PLACE_ADDRESS_TYPES:
        tier = 2
    elif address_type in _STRUCTURE_ADDRESS_TYPES:
        tier = 0
    else:
        tier = 1

    return tier, importance


def _nominatim_search(params: dict[str, str]) -> list[dict[str, Any]]:
    """One Nominatim request, spaced to the public rate limit.

    The lock is held across the request, so a burst of searches from different
    users becomes a queue of at most one request per second instead of a burst.
    """
    global _last_geocode_at

    with _geocode_lock:
        wait = GEOCODE_MIN_INTERVAL_S - (time.monotonic() - _last_geocode_at)

        if wait > 0:
            time.sleep(wait)

        # Marked before the call, so a failure still costs this slot rather than
        # letting the next request straight back out.
        _last_geocode_at = time.monotonic()

        payload = _fetch_json(
            NOMINATIM_URL,
            {**params, "format": "jsonv2", "addressdetails": "1", "email": CONTACT_EMAIL},
        )

    # Nominatim answers with a list, and an empty list is a miss, not a failure.
    if not isinstance(payload, list):
        raise DirectoryError(UPSTREAM_ERROR)

    return [item for item in payload if isinstance(item, dict)]


def _pick_place(candidates: list[dict[str, Any]], fallback_label: str) -> GeocodedLocation:
    """Choose the point to search around from Nominatim's candidates."""
    if not candidates:
        raise LocationNotFound(LOCATION_NOT_FOUND)

    # A single match is taken as given; otherwise prefer the broadest place.
    best = (
        candidates[0]
        if len(candidates) == 1
        else max(candidates, key=_candidate_score)
    )

    try:
        latitude = float(best["lat"])
        longitude = float(best["lon"])
    except (KeyError, TypeError, ValueError) as error:
        raise DirectoryError(UPSTREAM_ERROR) from error

    # A name to show in "Results near ...". `display_name` is the most complete
    # label Nominatim offers.
    name = best.get("display_name") or best.get("name") or fallback_label

    return GeocodedLocation(name=str(name), latitude=latitude, longitude=longitude)


def geocode(query: str) -> GeocodedLocation:
    """Resolve free text to a point with Nominatim.

    Only ever called for a submitted search, never as the user types, and only
    once per search, which is Nominatim's usage policy: absolute maximum one
    request per second. Recent identical lookups come from the cache instead.

    A bare six-digit PIN code is looked up as a postcode in the app's country
    first, because the same digits are valid in several countries and free-text
    ranking does not know which one the user meant. Anything else, including a
    PIN written with a name such as "Santacruz East 400055", is a normal text
    search.
    """
    text = (query or "").strip()

    if not text:
        raise LocationNotFound(LOCATION_NOT_FOUND)

    if len(text) > MAX_QUERY_LENGTH:
        text = text[:MAX_QUERY_LENGTH]

    cached = _cache_get(_geocode_cache, text, GEOCODE_CACHE_TTL_S)
    if cached is not None:
        return cached

    if PIN_CODE_PATTERN.match(text):
        candidates = _nominatim_search({"postalcode": text, "country": DEFAULT_PIN_COUNTRY})

        location = _pick_place(candidates, text) if candidates else None

        if location is None:
            # The code is not a postcode in that country. Fall back to a normal
            # text search rather than telling the user it does not exist.
            location = _pick_place(
                _nominatim_search(
                    {
                        "q": text,
                        # More than one candidate so the broadest place can be
                        # preferred over a same-named building.
                        "limit": "5",
                    }
                ),
                text,
            )
    else:
        location = _pick_place(
            _nominatim_search({"q": text, "limit": "5"}),
            text,
        )

    _cache_put(_geocode_cache, text, location)

    return location


def _overpass_query(latitude: float, longitude: float, radius_m: int) -> str:
    """Build the Overpass QL for healthcare facilities around a point.

    Two scans, not one per tag value: the public instances are far happier with a
    regex over a value list than with half a dozen separate `around` lookups, and
    that difference is the difference between a few seconds and a gateway
    timeout.

    `nwr` covers nodes, ways and relations. `out center` gives ways and
    relations a usable point instead of a geometry, which is all a directory
    card needs. Facilities with no name are not excluded here: they are real
    places, and the card falls back to the category so the entry is honest
    rather than invented.
    """
    around = f"around:{radius_m},{latitude:.6f},{longitude:.6f}"
    amenity_values = "|".join(AMENITY_VALUES)
    healthcare_values = "|".join(HEALTHCARE_VALUES)

    return (
        "[out:json][timeout:25];\n"
        "(\n"
        f'  nwr["amenity"~"^({amenity_values})$"]({around});\n'
        f'  nwr["healthcare"~"^({healthcare_values})$"]({around});\n'
        ");\n"
        f"out center tags {OVERPASS_ELEMENT_LIMIT};\n"
    )


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Straight-line distance in metres between two points.

    This is an approximation for sorting and for a rough "how far" label. It is
    a great-circle distance, not a walking or driving route.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )

    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def _first_tag(tags: dict[str, Any], *keys: str) -> Optional[str]:
    """Return the first non-empty value among `keys`, trimmed."""
    for key in keys:
        value = tags.get(key)

        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def _build_address(tags: dict[str, Any]) -> Optional[str]:
    """Assemble whatever address parts OpenStreetMap actually records.

    The full street address is built first; when only a partial one is mapped
    the parts that do exist are still shown, because a partial real address is
    more useful than no address.
    """
    parts = [
        _first_tag(
            tags,
            "addr:housenumber",
        ),
        _first_tag(tags, "addr:street"),
    ]
    street = " ".join(part for part in parts if part)

    locality = ", ".join(
        part
        for part in (
            _first_tag(tags, "addr:suburb", "addr:neighbourhood", "addr:city_district"),
            _first_tag(tags, "addr:city"),
            _first_tag(tags, "addr:postcode"),
        )
        if part
    )

    full = _first_tag(tags, "addr:full")

    if full:
        return full

    return ", ".join(part for part in (street, locality) if part) or None


def _detect_orthopedic(tags: dict[str, Any]) -> bool:
    """True only when OpenStreetMap records an orthopedic speciality.

    Specialty tags are the only evidence accepted. A facility being called a
    hospital, or having "ortho" in its name, is not evidence, and this
    directory does not turn either into a claim.
    """
    for key in (
        "healthcare:speciality",
        "speciality",
        "specialty",
        "healthcare_speciality",
        "specializations",
    ):
        value = tags.get(key)

        if not isinstance(value, str):
            continue

        parts = {piece.strip().lower() for piece in value.replace(";", ",").split(",")}

        if parts & set(ORTHOPEDIC_SPECIALITY_VALUES):
            return True

    return False


def _classify(tags: dict[str, Any]) -> Optional[str]:
    """Pick the directory category from the tags, or None if it is not a fit."""
    amenity = _first_tag(tags, "amenity")
    healthcare = _first_tag(tags, "healthcare")

    if amenity in AMENITY_VALUES:
        return amenity

    if healthcare in HEALTHCARE_VALUES:
        return healthcare

    return None


def _center_of(element: dict[str, Any]) -> Optional[tuple[float, float]]:
    """The point of an Overpass element.

    Nodes carry `lat`/`lon` directly. Ways and relations only carry geometry in
    the `center` block that `out center` produces.
    """
    try:
        if element.get("type") == "node" or ("lat" in element and "lon" in element):
            return float(element["lat"]), float(element["lon"])

        center = element.get("center")

        if isinstance(center, dict):
            return float(center["lat"]), float(center["lon"])
    except (KeyError, TypeError, ValueError):
        return None

    return None


def _providers_from_overpass(
    elements: Iterable[dict[str, Any]], latitude: float, longitude: float
) -> list[Provider]:
    """Turn Overpass elements into providers, nearest first.

    Sorted by distance so the card list leads with the closest options, and
    truncated so the page never renders hundreds of results.
    """
    providers: list[Provider] = []
    seen: set[tuple[float, float, str]] = set()

    for element in elements:
        if not isinstance(element, dict):
            continue

        tags = element.get("tags")

        if not isinstance(tags, dict):
            continue

        category = _classify(tags)

        if category is None:
            continue

        point = _center_of(element)

        if point is None:
            continue

        provider_lat, provider_lon = point

        # Overpass can return the same facility under both `amenity` and
        # `healthcare`; key on position and category so the card list does not
        # repeat one place.
        dedupe_key = (round(provider_lat, 5), round(provider_lon, 5), category)

        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)

        providers.append(
            Provider(
                name=_first_tag(tags, "name", "operator", "brand"),
                category=CATEGORY_LABELS.get(category, category.replace("_", " ").title()),
                address=_build_address(tags),
                phone=_first_tag(tags, "phone", "contact:phone", "contact:mobile"),
                website=_first_tag(tags, "website", "contact:website", "url"),
                latitude=provider_lat,
                longitude=provider_lon,
                distance_m=haversine_m(latitude, longitude, provider_lat, provider_lon),
                is_orthopedic=_detect_orthopedic(tags),
            )
        )

    providers.sort(key=lambda provider: provider.distance_m)

    return providers[:MAX_RESULTS]


def _run_overpass(latitude: float, longitude: float, radius_m: int) -> list[Provider]:
    query = _overpass_query(latitude, longitude, radius_m)
    last_error: Optional[Exception] = None
    started_at = time.monotonic()

    for index, endpoint in enumerate(OVERPASS_URLS):
        if index and time.monotonic() - started_at > OVERPASS_FALLBACK_BUDGET_S:
            # The first instance already held this search up for most of a
            # request's worth of time. Waiting for a second one would leave the
            # person waiting far too long to be told to try again.
            break

        try:
            payload = _fetch_json(endpoint, {"data": query}, post=True)
        except DirectoryError as error:
            # Try the second public instance before giving up.
            last_error = error
            continue

        # Overpass leaves the key out entirely when nothing matched, so a missing
        # key is a real answer of "nothing nearby", not a broken response.
        elements = payload.get("elements")

        if elements is None:
            elements = []

        if not isinstance(elements, list):
            last_error = DirectoryError(UPSTREAM_ERROR)
            continue

        return _providers_from_overpass(elements, latitude, longitude)

    raise DirectoryError(UPSTREAM_ERROR) from last_error


def find_nearby_providers(
    *, latitude: float, longitude: float, radius_m: int = DEFAULT_RADIUS_M
) -> list[Provider]:
    """Providers within `radius_m` of a point, nearest first.

    Identical recent searches are answered from the cache and concurrent
    identical searches share one upstream call, so a repeated search does not
    spend a second request on a public service.
    """
    radius_m = max(MIN_RADIUS_M, min(MAX_RADIUS_M, int(radius_m)))
    cache_key = f"{latitude:.4f},{longitude:.4f},{radius_m}"

    cached = _cache_get(_search_cache, cache_key, SEARCH_CACHE_TTL_S)
    if cached is not None:
        return cached

    with _lock_for(cache_key):
        # Another request may have filled the cache while this one waited.
        cached = _cache_get(_search_cache, cache_key, SEARCH_CACHE_TTL_S)
        if cached is not None:
            return cached

        providers = _run_overpass(latitude, longitude, radius_m)
        _cache_put(_search_cache, cache_key, providers)

        return providers


# Async wrappers. FastAPI is async, so the blocking standard-library calls run
# in a worker thread instead of stalling the event loop for other requests.
async def geocode_async(query: str) -> GeocodedLocation:
    """`geocode`, off the event loop."""
    return await asyncio.to_thread(geocode, query)


async def find_nearby_providers_async(
    *, latitude: float, longitude: float, radius_m: int = DEFAULT_RADIUS_M
) -> list[Provider]:
    """`find_nearby_providers`, off the event loop."""
    return await asyncio.to_thread(
        find_nearby_providers, latitude=latitude, longitude=longitude, radius_m=radius_m
    )
