import { authRequest } from './api'

/**
 * Healthcare directory service.
 *
 * The search itself runs on the backend, not here. The browser only ever calls
 * `GET /api/nearby-doctors`; Nominatim and Overpass stay behind that endpoint so
 * the public OpenStreetMap services see the backend's identifying User-Agent,
 * and so no endpoint or key can be swapped from the client. Neither service needs
 * a key or a payment method.
 *
 * Nothing from a search is cached in the browser and nothing is written to
 * MongoDB. A location is a lookup key, not patient data: it is used to answer
 * this one request and then dropped, and the results below are whatever
 * OpenStreetMap actually had recorded, with no field invented for a provider.
 *
 * Providers are returned in distance order by the backend. They are a directory
 * of places, not a judgement about care, so nothing here ranks quality or adds
 * a specialty the source data does not carry.
 */

/** Search radius, in metres. The backend caps the radius at 10 km. */
export const SEARCH_RADII = [
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
]

export const DEFAULT_RADIUS_M = SEARCH_RADII[0].value

/**
 * Normalize one provider into the shape the cards render.
 *
 * Optional fields stay `undefined` when OpenStreetMap has no value for them, so
 * a card can simply leave that line out instead of printing a blank or a
 * placeholder. `name` falls back to the category because an unmapped name is not
 * a reason to hide a real facility.
 */
function toProvider(raw) {
  if (raw == null) return null

  const category = typeof raw.category === 'string' ? raw.category : 'Healthcare facility'

  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : category,
    // True only when the facility has no name of its own and the heading is
    // standing in for it, which the card renders differently.
    isNameMissing: !(typeof raw.name === 'string' && raw.name.trim()),
    category,
    address: typeof raw.address === 'string' ? raw.address : null,
    phone: typeof raw.phone === 'string' ? raw.phone : null,
    website: typeof raw.website === 'string' ? raw.website : null,
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
    distanceM: Number(raw.distance_m),
    // OpenStreetMap's own specialty tag, never an inference from the name or
    // the facility category.
    isOrthopedic: Boolean(raw.is_orthopedic),
  }
}

/**
 * GET /api/nearby-doctors
 *
 * One of `location` or `latitude`/`longitude` must be given. The response is
 * always the same shape: where the search was centred, how wide it was, the
 * providers found, and the data-source note to show beneath them.
 *
 * Thrown errors are already the ones worth showing: 404 means the text was not
 * a place that could be resolved, 502 means the directory service itself failed.
 * Neither carries a raw upstream message.
 */
export async function searchNearbyDoctors(
  { location, latitude, longitude, radius = DEFAULT_RADIUS_M } = {},
  { signal } = {},
) {
  const params = new URLSearchParams()

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    params.set('latitude', String(latitude))
    params.set('longitude', String(longitude))
  } else if (location) {
    params.set('location', location)
  }

  params.set('radius', String(radius))

  const payload = await authRequest(`/api/nearby-doctors?${params.toString()}`, { signal })

  return {
    location: {
      name: payload?.location?.name ?? null,
      latitude: Number(payload?.location?.latitude ?? 0),
      longitude: Number(payload?.location?.longitude ?? 0),
    },
    radiusM: Number(payload?.radius_m ?? radius),
    count: Number(payload?.count ?? 0),
    providers: Array.isArray(payload?.providers)
      ? payload.providers.map(toProvider).filter(Boolean)
      : [],
    dataSource: payload?.data_source ?? 'OpenStreetMap',
    dataSourceNote:
      payload?.data_source_note ??
      'Provider information is sourced from OpenStreetMap and may be incomplete or outdated. Please verify availability, services, and contact details with the provider.',
  }
}
