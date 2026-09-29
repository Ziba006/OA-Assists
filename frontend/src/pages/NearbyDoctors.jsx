import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Check,
  ExternalLink,
  Globe,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Ruler,
  Search,
  Stethoscope,
} from 'lucide-react'

import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'
import { DEFAULT_RADIUS_M, SEARCH_RADII, searchNearbyDoctors } from '../services/directoryService'

const SECTION_LABEL_CLASS =
  'text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-400'

/** What the browser said, rendered as a calm inline notice under the controls. */
const MESSAGE_STYLES = {
  success: 'border-sage-200 bg-sage-50 text-sage-700',
  notice: 'border-sky-200 bg-sky-50 text-sky-700',
  error: 'border-error-500/30 bg-error-100 text-error-700',
}

/** The label shown for a search started from the browser's own coordinates. */
const CURRENT_LOCATION_LABEL = 'your current location'

/**
 * How a distance reads to a person.
 *
 * This is a straight-line distance, so it is always a rough "how far" figure and
 * never a route. Metres below a kilometre, kilometres above it, and always called
 * an approximation so nobody reads it as a driving distance.
 */
function formatDistance(metres) {
  if (!Number.isFinite(metres)) return null

  if (metres < 1000) return `Approx. ${Math.round(metres)} m`

  return `Approx. ${(metres / 1000).toFixed(1)} km`
}

/** A provider's own coordinates, for a map centred on that one place. */
function mapUrlFor(provider) {
  return `https://www.openstreetmap.org/?mlat=${provider.latitude}&mlon=${provider.longitude}#map=17/${provider.latitude}/${provider.longitude}`
}

/**
 * Directions to a provider, on openstreetmap.org.
 *
 * `from` is the location the person searched around, so the route is drawn from
 * there rather than from wherever the browser happens to be. It opens in
 * OpenStreetMap's own directions page: a free, key-free service, and not an
 * embedded map that would need a paid provider.
 */
function directionsUrlFor(provider, origin) {
  const from = origin ? `${origin.latitude},${origin.longitude}` : ''
  const to = `${provider.latitude},${provider.longitude}`
  const params = new URLSearchParams({ to })

  if (from) params.set('from', from)

  return `https://www.openstreetmap.org/directions?${params.toString()}`
}

/** A website from OpenStreetMap, only when it is actually a link. */
function safeWebsite(website) {
  if (!website) return null

  try {
    const url = new URL(website)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function ProviderCard({ provider, origin }) {
  const distance = formatDistance(provider.distanceM)
  const website = safeWebsite(provider.website)

  return (
    <li className="rounded-2xl border border-line bg-surface-warm p-5 transition-colors duration-200 hover:border-sage-200 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-50 text-sage-600 ring-1 ring-sage-200/80"
          aria-hidden="true"
        >
          <Building2 className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-sage-900">{provider.name}</h3>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
            <span className="font-medium text-plum-700">{provider.category}</span>
            {provider.isOrthopedic ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-200 bg-sage-50 px-2 py-0.5 text-[0.7rem] font-medium text-sage-700">
                <Stethoscope className="h-3 w-3" aria-hidden="true" />
                Orthopedic
              </span>
            ) : null}
          </p>

          {/*
            Every line below is rendered only when OpenStreetMap actually holds
            that value. An unmapped address, phone number or website is left out
            rather than filled in with a placeholder.
          */}
          {provider.address ? (
            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-ink-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              <span>{provider.address}</span>
            </p>
          ) : null}

          {distance ? (
            <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-500">
              <Ruler className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              <span>{distance}</span>
            </p>
          ) : null}

          {provider.phone ? (
            <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-600">
              <Phone className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              <a href={`tel:${provider.phone.replace(/\s+/g, '')}`} className="hover:text-sage-800 hover:underline">
                {provider.phone}
              </a>
            </p>
          ) : null}

          {website ? (
            <p className="mt-1.5 flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1 text-ink-600 hover:text-sage-800 hover:underline"
              >
                <span className="truncate">{website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href={mapUrlFor(provider)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              View on Map
            </a>

            <a
              href={directionsUrlFor(provider, origin)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Directions
            </a>
          </div>
        </div>
      </div>
    </li>
  )
}

/**
 * Find Nearby Care.
 *
 * A directory of real healthcare facilities near a place, read from
 * OpenStreetMap. Two OpenStreetMap services are involved and both are called by
 * the backend: Nominatim turns the typed area, city or PIN code into coordinates,
 * and Overpass returns the doctors, clinics and hospitals around them. The
 * browser only ever calls `GET /api/nearby-doctors`.
 *
 * Nothing here is invented. A facility appears because OpenStreetMap has it at
 * that point, a field is shown only when the source holds it, and the specialty
 * badge is only ever driven by a specialty tag in that data: this page does not
 * decide that a general hospital is an orthopedic one, and it does not rank
 * providers by quality, because a directory is not a recommendation.
 *
 * A search location is not patient data. It lives in component state for the
 * life of the visit and is never written to MongoDB or attached to an
 * assessment; the backend keeps no record of it either.
 */
export default function NearbyDoctors() {
  const [query, setQuery] = useState('')
  const [radius, setRadius] = useState(DEFAULT_RADIUS_M)
  const [searchLabel, setSearchLabel] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [message, setMessage] = useState(null)

  // Lets a new search cancel the one in flight, and lets a late reply from a
  // search the person has already replaced be dropped instead of rendered.
  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => () => abortRef.current?.abort(), [])

  const isSearching = status === 'searching'

  /**
   * Run one directory search.
   *
   * Called only from a button press, never while the field is being typed on, so
   * a single search costs a single geocode. The buttons are disabled while a
   * search runs, and the request itself is replaced rather than stacked, so
   * hammering the button cannot queue up requests against a public service.
   */
  const runSearch = useCallback(
    async ({ label, location, latitude, longitude }) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      setSearchLabel(label)
      setStatus('searching')
      setResult(null)
      setMessage(null)

      try {
        const payload = await searchNearbyDoctors(
          {
            location,
            latitude,
            longitude,
            radius,
          },
          { signal: controller.signal },
        )

        if (requestIdRef.current !== requestId) return

        setResult(payload)
        setStatus(payload.providers.length > 0 ? 'ready' : 'empty')
      } catch (error) {
        // A search that was replaced or left is not a failure to report.
        if (error?.name === 'AbortError' || requestIdRef.current !== requestId) return

        // A place that could not be resolved is its own outcome, and is never
        // shown as an empty result or as a service failure.
        setStatus(error?.status === 404 ? 'not-found' : 'error')
      }
    },
    [radius],
  )

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmed = query.trim()

    if (!trimmed) {
      setMessage({ tone: 'notice', text: 'Enter a location to find nearby care.' })
      return
    }

    runSearch({ label: trimmed, location: trimmed })
  }

  /**
   * Ask the browser where the user is, then search around those coordinates
   * directly. A refusal is a normal outcome rather than an error, and the typed
   * field stays the way in. The coordinates are not stored anywhere.
   */
  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setMessage({
        tone: 'notice',
        text: 'This browser cannot share a location. You can enter an area or PIN code instead.',
      })
      return
    }

    setIsLocating(true)
    setMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)

        // Started before the notice is set, because a search clears notices as
        // it begins: set this afterwards so the confirmation survives the search
        // it belongs to.
        runSearch({
          label: CURRENT_LOCATION_LABEL,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })

        setMessage({ tone: 'success', text: 'Current location selected' })
      },
      (error) => {
        setIsLocating(false)

        setMessage({
          tone: 'notice',
          text:
            error?.code === 1
              ? 'Location access was not allowed. You can enter an area or PIN code instead.'
              : 'Your current location could not be determined. You can enter an area or PIN code instead.',
        })
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  /** Repeat the last search, keeping whichever location it used. */
  const handleRetry = () => {
    if (result?.location) {
      runSearch({
        label: searchLabel,
        latitude: result.location.latitude,
        longitude: result.location.longitude,
      })
      return
    }

    const trimmed = query.trim()

    if (!trimmed) {
      setStatus('idle')
      setMessage({ tone: 'notice', text: 'Enter a location to find nearby care.' })
      return
    }

    runSearch({ label: trimmed, location: trimmed })
  }

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Support"
        title="Find Nearby Care"
        subtitle="Find doctors, clinics, and hospitals near you."
        status="Healthcare Directory"
        statusTone="brand"
        backTo={ROUTES.guidance}
        backLabel="Back to Guidance"
      />

      {/* Location selection */}
      <div className="mx-auto mt-8 w-full max-w-3xl">
        <Card className="border border-sky-200/70 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/80"
              aria-hidden="true"
            >
              <MapPin className="h-6 w-6" />
            </span>

            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-sage-900">
                Where would you like to find care?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                Enter an area, city, or PIN code, or use your current location.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <label htmlFor="nearby-location" className={SECTION_LABEL_CLASS}>
              Location
            </label>

            <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <input
                  id="nearby-location"
                  name="location"
                  type="text"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Enter area, city or PIN code"
                  className="w-full rounded-xl border border-line-strong bg-surface-warm py-3 pr-4 pl-11 text-sm text-ink-900 transition-colors duration-200 placeholder:text-ink-400 focus:border-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                />
              </div>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating || isSearching}
                className={buttonClasses({ variant: 'secondary', className: 'sm:w-auto' })}
              >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
                {isLocating ? 'Locating...' : 'Use My Current Location'}
              </button>
            </div>

            {/*
              How far to look. OpenStreetMap coverage is uneven, so a wider
              radius is offered as a real choice rather than a fallback phrase.
            */}
            <div className="mt-5">
              <span className={SECTION_LABEL_CLASS}>Search radius</span>

              <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Search radius">
                {SEARCH_RADII.map((option) => {
                  const isActive = option.value === radius

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRadius(option.value)}
                      aria-pressed={isActive}
                      className={[
                        buttonClasses({ variant: isActive ? 'primary' : 'secondary', size: 'sm' }),
                        'rounded-full',
                      ].join(' ')}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5">
              <button
                type="submit"
                disabled={isSearching || isLocating}
                className={buttonClasses({ variant: 'primary', className: 'w-full sm:w-auto' })}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Find Doctors
              </button>
            </div>
          </form>

          {message ? (
            <div
              role="status"
              className={`mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${MESSAGE_STYLES[message.tone]}`}
            >
              {message.tone === 'success' ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <p className="leading-relaxed">{message.text}</p>
            </div>
          ) : null}

          {/*
            Kept on screen while the search runs, because "where we are looking"
            is the one thing worth reading during the wait.
          */}
          {searchLabel ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-plum-200/70 bg-plum-50/50 px-4 py-3 text-sm">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
              <p className="leading-relaxed text-ink-700">
                Searching near: <span className="font-semibold text-sage-900">{searchLabel}</span>
              </p>
            </div>
          ) : null}

          {searchLabel ? (
            <p className="mt-3 text-xs leading-relaxed text-ink-400">
              Coordinates are held in this page only, for the duration of the visit, and are not
              stored with the patient.
            </p>
          ) : null}
        </Card>

        {/* Privacy */}
        <div className="mt-4 flex gap-3.5 rounded-2xl border border-line bg-surface-warm px-5 py-4">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-plum-600" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink-500">
            Your location is used only to find nearby healthcare providers. It is not saved as
            part of the patient assessment.
          </p>
        </div>
      </div>

      {/* Results */}
      <section aria-label="Nearby healthcare providers" className="animate-fade-up mt-12">
        <h2 className={SECTION_LABEL_CLASS}>Nearby healthcare providers</h2>

        {status === 'searching' ? (
          <Card className="mt-4 p-6 sm:p-8" aria-busy="true">
            <div className="flex flex-col items-center px-4 py-10 text-center" role="status">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-50 text-sage-500 ring-1 ring-sage-200/80"
                aria-hidden="true"
              >
                <Loader2 className="h-6 w-6 animate-spin" />
              </span>

              <h3 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                Finding nearby healthcare providers...
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                Looking up {searchLabel || 'your location'} on OpenStreetMap. This can take a few
                seconds.
              </p>
            </div>
          </Card>
        ) : null}

        {status === 'ready' && result ? (
          <>
            <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-sage-900">
                  Nearby Healthcare Providers
                </h3>
                <p className="mt-1 text-sm text-ink-500">Results near {searchLabel}</p>
              </div>

              <p className="text-sm text-ink-500">
                {result.count} {result.count === 1 ? 'provider' : 'providers'} within{' '}
                {result.radiusM >= 1000 ? `${result.radiusM / 1000} km` : `${result.radiusM} m`}
              </p>
            </div>

            <ul className="mt-5 grid gap-4 lg:grid-cols-2">
              {result.providers.map((provider, index) => (
                <ProviderCard
                  key={`${provider.latitude}-${provider.longitude}-${index}`}
                  provider={provider}
                  origin={result.location}
                />
              ))}
            </ul>

            <p className="mt-4 text-sm text-ink-500">Showing the nearest available results.</p>

            {/*
              OpenStreetMap is crowd-sourced, so this is where a person is told
              that an entry may be stale before they call or travel to it.
            */}
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink-400">
              {result.dataSourceNote}
            </p>
          </>
        ) : null}

        {status === 'empty' ? (
          <Card className="mt-4 p-6 sm:p-8">
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/80"
                aria-hidden="true"
              >
                <Stethoscope className="h-6 w-6" />
              </span>

              <h3 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                No nearby healthcare providers found
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                Try a different area or increase the search radius.
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className={buttonClasses({ variant: 'primary', size: 'sm', className: 'mt-6' })}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Search Again
              </button>
            </div>
          </Card>
        ) : null}

        {status === 'not-found' ? (
          <Card className="mt-4 border border-amber-200/70 p-6 sm:p-8">
            <div className="flex flex-col items-center px-4 py-10 text-center" role="alert">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/80"
                aria-hidden="true"
              >
                <MapPin className="h-6 w-6" />
              </span>

              <h3 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                Location not found
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                Try entering a nearby area, city, or PIN code.
              </p>

              <button
                type="button"
                onClick={() => {
                  setStatus('idle')
                  setMessage({ tone: 'notice', text: 'Enter a location to find nearby care.' })
                }}
                className={buttonClasses({ variant: 'primary', size: 'sm', className: 'mt-6' })}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search Again
              </button>
            </div>
          </Card>
        ) : null}

        {status === 'error' ? (
          <Card className="mt-4 border border-error-500/30 p-6 sm:p-8">
            <div className="flex flex-col items-center px-4 py-10 text-center" role="alert">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-100 text-error-600 ring-1 ring-error-500/20"
                aria-hidden="true"
              >
                <AlertTriangle className="h-6 w-6" />
              </span>

              <h3 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                We couldn't complete the search right now.
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                Please try again in a moment or search for a different location.
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className={buttonClasses({ variant: 'primary', size: 'sm', className: 'mt-6' })}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </button>
            </div>
          </Card>
        ) : null}

        {status === 'idle' ? (
          <Card className="mt-4 p-6 sm:p-8">
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-50 text-sage-500 ring-1 ring-sage-200/80"
                aria-hidden="true"
              >
                <Building2 className="h-6 w-6" />
              </span>

              <h3 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                No search yet
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                Enter an area, city or PIN code, or use your current location, to find doctors,
                clinics and hospitals around you.
              </p>

              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-3.5 py-1.5 text-xs font-medium text-ink-500">
                <Stethoscope className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
                Provider data from OpenStreetMap
              </p>
            </div>
          </Card>
        ) : null}
      </section>
    </div>
  )
}
