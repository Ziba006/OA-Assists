import { useState } from 'react'
import {
  Building2,
  Check,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Stethoscope,
} from 'lucide-react'

import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

const SECTION_LABEL_CLASS =
  'text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-400'

/** What the browser said, rendered as a calm inline notice under the controls. */
const MESSAGE_STYLES = {
  success: 'border-sage-200 bg-sage-50 text-sage-700',
  notice: 'border-sky-200 bg-sky-50 text-sky-700',
  error: 'border-error-500/30 bg-error-100 text-error-700',
}

/** Shown on the results card while there is nothing to list. */
const EMPTY_RESULTS = 'Enter a location and search to find nearby orthopedic care.'

/**
 * Find Nearby Care.
 *
 * This is the location step only. The page collects *where* to look and hands
 * that to nothing yet: there is no provider search endpoint, so it deliberately
 * stops at an empty results area rather than showing invented doctors. Nothing
 * is fetched, ranked, rated or stored.
 *
 * A typed area and the browser's coordinates both live in component state for
 * the life of the page. They are never sent anywhere, never written to the
 * assessment, and never included in a request, so choosing a location cannot
 * change a patient's record.
 */
export default function NearbyDoctors() {
  const [query, setQuery] = useState('')
  const [searchedLocation, setSearchedLocation] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmed = query.trim()

    if (!trimmed) {
      setSearchedLocation('')
      setMessage({ tone: 'notice', text: 'Enter a location to find nearby care.' })
      return
    }

    setSearchedLocation(trimmed)
    setMessage(null)
  }

  /**
   * Ask the browser where the user is. Nothing is stored beyond this component,
   * and a refusal is a normal outcome rather than an error: the typed-area
   * field stays the way in.
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
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setMessage({ tone: 'success', text: 'Current location selected' })
      },
      (error) => {
        setIsLocating(false)
        setCoordinates(null)

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

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Support"
        title="Find Nearby Care"
        subtitle="Find orthopedic doctors, clinics, and hospitals near you."
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
                disabled={isLocating}
                className={buttonClasses({ variant: 'secondary', className: 'sm:w-auto' })}
              >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
                {isLocating ? 'Locating...' : 'Use My Current Location'}
              </button>
            </div>

            <div className="mt-5">
              <button
                type="submit"
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

          {searchedLocation ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-plum-200/70 bg-plum-50/50 px-4 py-3 text-sm">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
              <p className="leading-relaxed text-ink-700">
                Searching near:{' '}
                <span className="font-semibold text-sage-900">{searchedLocation}</span>
              </p>
            </div>
          ) : null}

          {coordinates ? (
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

        <Card className="mt-4 p-6 sm:p-8">
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-50 text-sage-500 ring-1 ring-sage-200/80"
              aria-hidden="true"
            >
              <Building2 className="h-6 w-6" />
            </span>

            <h3 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
              {searchedLocation ? `Providers near ${searchedLocation}` : 'No search yet'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              {EMPTY_RESULTS}
            </p>

            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-3.5 py-1.5 text-xs font-medium text-ink-500">
              <Stethoscope className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
              Doctor search is not connected yet
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}
