"""Live check of the OpenStreetMap directory service. Not part of the app."""

import asyncio
import json
import sys

sys.path.insert(0, ".")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.services import directory_service as ds


def show(label, coro):
    try:
        return asyncio.run(coro)
    except Exception as error:  # noqa: BLE001
        print(f"[{label}] ERROR {type(error).__name__}: {error}")
        return None


def show_location(label, coro):
    location = show(label, coro)
    if location:
        print("   ", location.latitude, location.longitude, "|", location.name[:80])
    return location


def show_providers(label, latitude, longitude, radius=5000):
    providers = show(label, ds.find_nearby_providers_async(
        latitude=latitude, longitude=longitude, radius_m=radius))
    if providers is None:
        return None
    print("    count:", len(providers))
    for p in providers[:4]:
        print("    -", p.as_dict())
    return providers


location = show_location("geocode Santacruz East", ds.geocode_async("Santacruz East"))
pin = show_location("geocode 400055", ds.geocode_async("400055"))
area = show_location("geocode Andheri East", ds.geocode_async("Andheri East"))
nope = show("geocode nonsense", ds.geocode_async("zzqqxx notaplace12345"))
print("    nonsense ->", nope)

if location:
    providers = show_providers("overpass santacruz 5000m", location.latitude, location.longitude)
    cached = show_providers("cached repeat", location.latitude, location.longitude)
    if cached is not None and providers is not None:
        same = json.dumps([p.as_dict() for p in cached]) == json.dumps([p.as_dict() for p in providers])
        print("    cache identical:", same)

remote = show_providers("overpass empty rural ocean", -40.0, -150.0)

sorted_ok = None
if providers:
    distances = [p.distance_m for p in providers]
    sorted_ok = distances == sorted(distances)
    print("    sorted ascending:", sorted_ok, "| max:", max(distances))

# A wide radius to prove the limit and the sort hold beyond 15 rows.
wide = show_providers("overpass 20000m", *(
    (location.latitude, location.longitude) if location else (19.08, 72.84)), radius=20000)
if wide:
    print("    wide count (capped at 15):", len(wide))
