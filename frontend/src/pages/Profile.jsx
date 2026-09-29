import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Footprints,
  History,
  LogOut,
  Mail,
  Pencil,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'

import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { getCurrentUser } from '../services/authService'
import { listAssessments } from '../services/assessmentService'
import { listPatients, toPatientList } from '../services/patientService'
import { ROUTES } from '../routes'

/**
 * The signed-in account, not a patient.
 *
 * Everything shown here is read back from the backend for the person whose JWT
 * is in storage: the identity from `GET /api/auth/me`, the counts from
 * `GET /api/patients` and `GET /api/assessments`, which the backend already
 * scopes to that same user. There is no id in the URL, no way to ask for a
 * different account, and no field the backend does not already return. Patient
 * records live in Patient Overview and are deliberately not repeated here.
 *
 * The counts are tallies of stored rows, nothing more. There is no score, no
 * severity band and no ranking: a count of assessments says how much was
 * recorded, not what it means.
 */

/** The two-letter monogram, taken from the real name. */
function initialsFor(fullName, email) {
  const words = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
  }

  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  // No usable name, so fall back to the local part of the real address rather
  // than inventing one.
  const local = String(email || '').split('@')[0] || ''

  return local.slice(0, 2).toUpperCase() || '?'
}

/** One label/value row. Rendered only when there is a real value to show. */
function InfoRow({ label, value, icon: Icon }) {
  if (!value) return null

  return (
    <div className="flex items-start gap-3.5 border-b border-line py-3.5 last:border-b-0">
      {Icon ? (
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink-500"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">{label}</dt>
        <dd className="mt-1 text-sm break-words text-sage-900">{value}</dd>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-warm p-5 shadow-card">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-sage-900">{value}</p>
      <p className="mt-1 text-sm text-ink-500">{label}</p>
    </div>
  )
}

/** A placeholder for a setting the backend cannot do yet. */
function ComingSoonButton({ label, description, icon: Icon }) {
  return (
    <div className="flex w-full flex-col items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-muted/60 p-5 text-left sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-warm text-ink-400"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-sage-900">{label}</h3>
            <Badge tone="warning">Coming Soon</Badge>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
        </div>
      </div>

      <button
        type="button"
        disabled
        aria-disabled="true"
        title={`${label} is not available yet`}
        className={`${buttonClasses({ variant: 'secondary', size: 'sm' })} w-full cursor-not-allowed sm:w-auto`}
      >
        {label}
      </button>
    </div>
  )
}

function SkeletonBlock({ className = '' }) {
  return <span className={`block animate-pulse rounded bg-surface-muted ${className}`} aria-hidden="true" />
}

export default function Profile() {
  const navigate = useNavigate()
  const { isAuthenticated, isGuest, signOut } = useAuth()

  // The account is read back from GET /api/auth/me so what is shown is what the
  // backend confirms for this token, on first load and after a refresh alike.
  const [account, setAccount] = useState(null)
  const [profileError, setProfileError] = useState(false)
  const [profileToken, setProfileToken] = useState(0)
  const [profileSettled, setProfileSettled] = useState(-1)

  const [patients, setPatients] = useState([])
  const [assessments, setAssessments] = useState([])
  const [statsError, setStatsError] = useState(false)
  const [statsToken, setStatsToken] = useState(0)
  const [statsSettled, setStatsSettled] = useState(-1)

  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const activeRequest = useRef(null)

  useEffect(
    () =>
      () => {
        activeRequest.current?.abort()
      },
    [],
  )

  // ---- the account itself ------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) return undefined

    const controller = new AbortController()
    activeRequest.current = controller

    getCurrentUser()
      .then((data) => {
        if (controller.signal.aborted) return

        setAccount(data && data.id && data.email ? data : null)
        setProfileError(false)
        setProfileSettled(profileToken)
      })
      .catch((error) => {
        // A 401 means the token was rejected. `authRequest` has already cleared
        // the session, and RequireAuth will move to the login page, so there is
        // no profile to draw and nothing to show but the error.
        if (controller.signal.aborted || error?.name === 'AbortError') return

        setProfileError(true)
        setProfileSettled(profileToken)
      })

    return () => controller.abort()
  }, [isAuthenticated, profileToken])

  // ---- the activity tallies ---------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) return undefined

    const controller = new AbortController()
    activeRequest.current = controller

    Promise.all([
      listPatients({ signal: controller.signal }),
      listAssessments(undefined, { signal: controller.signal }),
    ])
      .then(([patientPayload, assessmentPayload]) => {
        if (controller.signal.aborted) return

        setPatients(toPatientList(patientPayload))
        setAssessments(assessmentPayload)
        setStatsError(false)
        setStatsSettled(statsToken)
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') return

        setStatsError(true)
        setStatsSettled(statsToken)
      })

    return () => controller.abort()
  }, [isAuthenticated, statsToken])

  const retryProfile = useCallback(() => {
    setProfileError(false)
    setProfileToken((token) => token + 1)
  }, [])

  const retryStats = useCallback(() => {
    setStatsError(false)
    setStatsToken((token) => token + 1)
  }, [])

  // Counted from the assessments themselves, exactly as the Dashboard does, so
  // the two pages cannot disagree. Gait is counted like any other type: a
  // module that has never been used reads as 0, not as a missing value.
  const stats = useMemo(() => {
    const byType = (type) => assessments.filter((entry) => entry.type === type).length

    return [
      {
        key: 'patients',
        label: 'Total Patients',
        value: patients.length,
        icon: Users,
        accent: 'border-sage-200 bg-sage-50 text-sage-600',
      },
      {
        key: 'assessments',
        label: 'Total Assessments',
        value: assessments.length,
        icon: History,
        accent: 'border-plum-200 bg-plum-50 text-plum-700',
      },
      {
        key: 'xray',
        label: 'X-Ray Assessments',
        value: byType('xray'),
        icon: ScanLine,
        accent: 'border-plum-200 bg-plum-50 text-plum-700',
      },
      {
        key: 'symptoms',
        label: 'Symptoms Assessments',
        value: byType('symptoms'),
        icon: ClipboardList,
        accent: 'border-sky-200 bg-sky-50 text-sky-600',
      },
      {
        key: 'gait',
        label: 'Gait Assessments',
        value: byType('gait'),
        icon: Footprints,
        accent: 'border-warning-100 bg-warning-100 text-warning-700',
      },
    ]
  }, [patients, assessments])

  const isProfileLoading = isAuthenticated && profileSettled !== profileToken
  const isStatsLoading = isAuthenticated && statsSettled !== statsToken

  const fullName = account?.fullName ?? ''
  const email = account?.email ?? ''
  // The backend has no role field today, so nothing is shown for one. If one is
  // ever added it will appear here without the page having to change.
  const role = account?.role ?? ''

  const handleSignOut = () => {
    // Exactly the existing sign-out path: clear the stored session, then return
    // to the login page. Nothing is left behind to log in with.
    signOut()
    setConfirmSignOut(false)
    navigate(ROUTES.login)
  }

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Your OA Assist account and the activity stored against it."
        backTo={ROUTES.dashboard}
      />

      {/* Guests have no account behind the session, so there is no identity to
          show. Saying so is honest; a blank avatar would not be. */}
      {isGuest ? (
        <Card className="mt-8 border-warning-100 bg-warning-100/50 p-5">
          <p className="text-sm leading-relaxed text-sage-800">
            You are browsing as a guest. A guest session has no account, so there are no account
            details or saved activity to show. Sign in to see your profile.
          </p>
        </Card>
      ) : null}

      {isProfileLoading ? (
        <Card className="mt-8 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <SkeletonBlock className="h-20 w-20 rounded-2xl" />
            <div className="w-full flex-1">
              <SkeletonBlock className="h-6 w-56" />
              <SkeletonBlock className="mt-3 h-4 w-72" />
              <SkeletonBlock className="mt-4 h-6 w-36 rounded-full" />
            </div>
          </div>
        </Card>
      ) : null}

      {!isProfileLoading && profileError ? (
        <Card className="mt-8 border border-error-100 p-6 sm:p-8">
          <div className="flex flex-col items-center px-4 py-8 text-center" role="alert">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-error-100 bg-error-100 text-error-700"
              aria-hidden="true"
            >
              <UserRound className="h-6 w-6" />
            </span>

            <h2 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
              Unable to load profile.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              Your account details could not be read from the server.
            </p>

            <button
              type="button"
              onClick={retryProfile}
              className={buttonClasses({ variant: 'primary', size: 'sm', className: 'mt-6' })}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      {account ? (
        <>
          {/* The identity panel. Deliberately the strongest thing on the page,
              set on the dark sage ground the sidebar uses. */}
          <Card className="mt-8 overflow-hidden border-0 bg-sage-900 p-0 shadow-lift">
            <div className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:items-center sm:gap-7 sm:p-8 sm:text-left">
              <span
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-cream/20 bg-cream/10 text-2xl font-semibold tracking-tight text-cream"
                aria-hidden="true"
              >
                {initialsFor(fullName, email)}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold tracking-tight break-words text-cream">
                  {fullName}
                </h2>
                <p className="mt-2 flex items-center justify-center gap-2 text-sm break-words text-sage-200 sm:justify-start">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {email}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge tone="brand" dot>
                    OA Assist Account
                  </Badge>

                  {role ? <Badge tone="sage">{role}</Badge> : null}

                  <Badge tone="dark">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Signed in
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Account Information */}
            <Card className="h-fit p-6 sm:p-7">
              <h2 className="text-base font-semibold text-sage-900">Account Information</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                The details this account is signed in with.
              </p>

              <dl className="mt-4">
                <InfoRow label="Full Name" value={fullName} icon={UserRound} />
                <InfoRow label="Email" value={email} icon={Mail} />
                <InfoRow label="Role" value={role} icon={ShieldCheck} />

                {/* The password, its hash, the token and the internal database
                    id are deliberately absent: this account has no way to read
                    any of them, and a password is never held in the browser. */}
              </dl>
            </Card>

            {/* Your Activity */}
            <Card className="h-fit p-6 sm:p-7">
              <h2 className="text-base font-semibold text-sage-900">Your Activity</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                What is stored against this account.
              </p>

              {isStatsLoading ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-busy="true">
                  {[0, 1, 2, 3, 4].map((key) => (
                    <div key={key} className="rounded-2xl border border-line bg-surface-warm p-5">
                      <SkeletonBlock className="h-10 w-10 rounded-xl" />
                      <SkeletonBlock className="mt-4 h-7 w-12" />
                      <SkeletonBlock className="mt-2 h-3.5 w-28" />
                    </div>
                  ))}
                </div>
              ) : null}

              {!isStatsLoading && statsError ? (
                <div className="mt-5 rounded-2xl border border-error-100 p-5 text-center" role="alert">
                  <p className="text-sm leading-relaxed text-sage-900">
                    Unable to load your activity.
                  </p>
                  <button
                    type="button"
                    onClick={retryStats}
                    className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-4' })}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              ) : null}

              {!isStatsLoading && !statsError ? (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {stats.map(({ key, label, value, icon, accent }) => (
                      <StatCard
                        key={key}
                        label={label}
                        value={value}
                        icon={icon}
                        accent={accent}
                      />
                    ))}
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-ink-400">
                    These are counts of records saved to this account. They are not a score and say
                    nothing about a patient&apos;s health.
                  </p>
                </>
              ) : null}
            </Card>
          </div>

          {/* Account Settings */}
          <section aria-labelledby="account-settings-heading" className="mt-6">
            <Card className="p-6 sm:p-7">
              <h2 id="account-settings-heading" className="text-base font-semibold text-sage-900">
                Account Settings
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                Manage this account and its access.
              </p>

              <div className="mt-5 space-y-3">
                <ComingSoonButton
                  label="Edit Profile"
                  description="Profile editing will be available soon."
                  icon={Pencil}
                />

                <ComingSoonButton
                  label="Change Password"
                  description="Changing your password will be available soon."
                  icon={ShieldCheck}
                />

                <div className="flex w-full flex-col items-start gap-3 rounded-2xl border border-line bg-surface-warm p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-error-100 bg-error-100 text-error-700"
                      aria-hidden="true"
                    >
                      <LogOut className="h-5 w-5" />
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold text-sage-900">Log Out</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">
                        Sign out of this account on this device.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmSignOut(true)}
                    className={buttonClasses({
                      variant: 'danger',
                      size: 'sm',
                      className: 'w-full sm:w-auto',
                    })}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Log Out
                  </button>
                </div>
              </div>
            </Card>
          </section>
        </>
      ) : null}

      <ConfirmDialog
        isOpen={confirmSignOut}
        title="Log out of OA Assist?"
        description="You will be returned to the login page and will need to sign in again to see your account."
        confirmLabel="Log Out"
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  )
}
