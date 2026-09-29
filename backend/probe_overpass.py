"""Probe: does a short Overpass server-side timeout return partial rows instead of a 504?"""

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, ".")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.services import directory_service as ds

HEADERS = {
    "User-Agent": "OA-Assist/1.0 (directory)",
    "Content-Type": "application/x-www-form-urlencoded",
}


def run(query, timeout=60):
    started = time.time()
    try:
        request = urllib.request.Request(
            "https://overpass-api.de/api/interpreter",
            data=urllib.parse.urlencode({"data": query}).encode("utf-8"),
            headers=HEADERS,
        )
        raw = urllib.request.urlopen(request, timeout=timeout).read().decode("utf-8")
        payload = json.loads(raw)
        elements = payload.get("elements")
        return {
            "status": "OK",
            "elements": len(elements) if isinstance(elements, list) else None,
            "has_key": "elements" in payload,
            "remark": str(payload.get("remark"))[:70],
            "seconds": round(time.time() - started, 1),
        }
    except urllib.error.HTTPError as error:
        return {"status": f"HTTP{error.code}", "seconds": round(time.time() - started, 1)}
    except Exception as error:
        return {"status": type(error).__name__, "seconds": round(time.time() - started, 1)}


lat, lon, radius = 19.0768, 72.8369, 10000

for timeout in (5, 10, 15, 25):
    query = ds._overpass_query(lat, lon, radius).replace("[timeout:25]", f"[timeout:{timeout}]")
    print(f"10km server timeout={timeout:<3}", run(query))

print("5km server timeout=10 ", run(ds._overpass_query(lat, lon, 5000).replace("[timeout:25]", "[timeout:10]")))
