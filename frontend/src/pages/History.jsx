import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Footprints,
  History as HistoryIcon,
  Loader2,
  RefreshCw,
  ScanLine,
  Search,
  Trash2,
} from 'lucide-react'

import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { usePatient } from '../hooks/usePatient'
import { formatDateTime } from '../constants/format'
import { resultHeadline } from '../constants/resultCopy'
import { deleteAssessment, listAssessments } from '../services/assessmentService'
import { listPatients, toPatientList } from '../services/patientService'
import { ROUTES } from '../routes'

/** How long the "Assessment deleted" confirmation stays on screen. */
const TOAST_MS = 4000

const TYPE_FILTERS = [
  { value: 'all', label: 'All Assessments' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'symptoms', label: 'Symptoms' },
  { value: 'gait', label: 'Gait' },
]

/**
 * The three modules and how each one is drawn.
 *
 * Gait is listed because the platform has the slot for it, not because it works
 * today. The module is still a placeholder and the backend has never stored a
 * gait document, so an account with no gait records simply has none here.
 */
const TYPES = {
  xray: {
    label: 'X-Ray Assessment',
    shortLabel: 'X-Ray',
    icon: ScanLine,
    accent: 'border-plum-200 bg-plum-50 text-plum-700',
    tone: 'brand',
  },
  symptoms: {
    label: 'Symptoms Assessment',
    shortLabel: 'Symptoms',
    icon: ClipboardList,
    accent: 'border-sky-200 bg-sky-50 text-sky-600',
    tone: 'neutral',
  },
  gait: {
    label: 'Gait Assessment',
    shortLabel: 'Gait',
    icon: Footprints,
    accent: 'border-warning-100 bg-warning-100 text-warning-700',
    tone: 'sage',
  },
}

function typeMeta(type) {
  return TYPES[type] ?? {
    label: 'Assessment',
    shortLabel: 'Assessment',
    icon: FileText,
    accent: 'border-line bg-surface-muted text-ink-700',
    tone: 'neutral',
  }
}

/**
 * The short status line for one record.
 *
 * For an X-ray this is the stored model's own result, worded by the shared
 * result copy so the history, the patient overview and the report cannot drift
 * apart. It is never a diagnosis: nothing here says a patient has OA.
 *
 * Symptoms are recorded, not interpreted, so the line only says the responses
 * exist. A gait record shows its stored result when the backend has one, and
 * says only that a record exists when it does not.
 */
function statusFor(assessment) {
  if (assessment.type === 'xray') {
    return assessment.xray
      ? resultHeadline(assessment.xray.oa_indication)
      : 'X-ray assessment recorded'
  }

  if (assessment.type === 'symptoms') return 'Symptoms recorded'

  if (assessment.type === 'gait') {
    return assessment.gait?.result
      ? String(assessment.gait.result)
      : 'Gait assessment recorded'
  }

  return 'Assessment recorded'
}

/** Midnight today, so a day group is not skewed by the time of day. */
function startOfDay(value) {
  const date = new Date(value)

  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * Which band a record belongs to, counted in whole days from today.
 *
 * The groups are only a reading aid. Every card still carries its own real date
 * and time, and nothing is dated, moved or relabelled to make a group tidy.
 */
function dayGroup(value, now = new Date()) {
  const days = Math.round((startOfDay(now) - startOfDay(value)) / 86_400_000)

  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Earlier this week'

  return 'Older'
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier this week', 'Older']

function SkeletonRow() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <span className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-surface-muted" aria-hidden="true" />
        <div className="flex-1">
          <span className="block h-4 w-48 animate-pulse rounded bg-surface-muted" aria-hidden="true" />
          <span className="mt-2.5 block h-3 w-72 animate-pulse rounded bg-surface-muted" aria-hidden="true" />
          <span className="mt-2 block h-3 w-32 animate-pulse rounded bg-surface-muted" aria-hidden="true" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Assessment History.
 *
 * One chronological record of every assessment saved against every patient this
 * account owns, read from `GET /api/assessments`, which the backend already
 * scopes to the signed-in user. Patient names are joined from
 * `GET /api/patients`; a record whose patient has since been deleted still
 * shows, with its patient id, because the assessment is still stored.
 *
 * This is a record of activity, not a clinical view. There is no score, no
 * severity band and no ranking: a line says what the module returned, and the
 * full wording of any result lives on the report page.
 *
 * Search and the type filter run over the records already loaded, so they
 * narrow real data without another request. Deleting uses the same endpoint the
 * patient overview uses, removes one assessment and never the patient.
 */
export default function History() {
  const navigate = useNavigate()
  const { isAuthenticated, isGuest } = useAuth()
  const { patient: selectedPatient, setPatient } = usePatient()

  const [assessments, setAssessments] = useState([])
  const [patients, setPatients] = useState([])
  const [loadError, setLoadError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [settledToken, setSettledToken] = useState(-1)

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')

  // Lets the in-flight load be cancelled when the page is left or retried.
  const activeRequest = useRef(null)

  useEffect(
    () =>
      () => {
        activeRequest.current?.abort()
      },
    [],
  )

  useEffect(() => {
    // A guest session stores nothing, so there is no history to read and
    // nothing to count. The page says so rather than showing an invented list.
    if (!isAuthenticated) return undefined

    const controller = new AbortController()
    activeRequest.current = controller

    // The records and the names to go with them are needed together before
    // anything can be drawn, so they are fetched in parallel.
    Promise.all([
      listAssessments(undefined, { signal: controller.signal }),
      listPatients({ signal: controller.signal }),
    ])
      .then(([assessmentPayload, patientPayload]) => {
        if (controller.signal.aborted) return

        setAssessments(assessmentPayload)
        setPatients(toPatientList(patientPayload))
        setLoadError(false)
        setSettledToken(reloadToken)
      })
      .catch((error) => {
        // A cancelled load is this page closing or a retry replacing it.
        if (controller.signal.aborted || error?.name === 'AbortError') return

        setLoadError(true)
        setSettledToken(reloadToken)
      })

    return () => controller.abort()
  }, [isAuthenticated, reloadToken])

  useEffect(() => {
    if (!notice) return undefined

    const timer = setTimeout(() => setNotice(''), TOAST_MS)

    return () => clearTimeout(timer)
  }, [notice])

  const handleRetry = useCallback(() => {
    setLoadError(false)
    setReloadToken((token) => token + 1)
  }, [])

  const patientById = useMemo(() => {
    const map = new Map()

    for (const entry of patients) map.set(entry.patient_id, entry)

    return map
  }, [patients])

  const isLoading = isAuthenticated && settledToken !== reloadToken
  const hasAssessments = assessments.length > 0

  // Search and the type filter narrow the records already loaded. Both are
  // case-insensitive and match either the patient's name or their id.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return assessments
      .filter((assessment) => (typeFilter === 'all' ? true : assessment.type === typeFilter))
      .filter((assessment) => {
        if (!needle) return true

        const name = patientById.get(assessment.patient_id)?.name ?? ''

        return (
          name.toLowerCase().includes(needle) || assessment.patient_id.toLowerCase().includes(needle)
        )
      })
  }, [assessments, typeFilter, query, patientById])

  // Grouped newest first, keeping the backend's own newest-first order inside
  // each band so the timeline reads downwards.
  const groups = useMemo(() => {
    const buckets = new Map()

    for (const assessment of visible) {
      const label = dayGroup(assessment.created_at)

      if (!buckets.has(label)) buckets.set(label, [])
      buckets.get(label).push(assessment)
    }

    return GROUP_ORDER.filter((label) => buckets.has(label)).map((label) => ({
      label,
      items: buckets.get(label),
    }))
  }, [visible])

  const clearFilters = () => {
    setQuery('')
    setTypeFilter('all')
  }

  const filtersAreActive = query.trim().length > 0 || typeFilter !== 'all'

  /**
   * Open one record in the existing report page.
   *
   * Opened the same way the dashboard and the patient overview open it, with
   * `?assessment_id=`, so this is the same report and not a second one. The
   * report page needs the assessed patient to be the current one, so a record
   * belonging to another patient makes them current first.
   */
  const handleViewReport = (assessment) => {
    const owner = patientById.get(assessment.patient_id)

    if (owner && owner.patient_id !== selectedPatient?.patient_id) setPatient(owner)

    navigate(`${ROUTES.report}?assessment_id=${encodeURIComponent(assessment.id)}`)
  }

  const closeDialog = () => {
    if (deletingId) return

    setPendingDelete(null)
    setDeleteError('')
  }

  const confirmDelete = async () => {
    if (!pendingDelete || deletingId) return

    const target = pendingDelete
    setDeletingId(target.id)
    setDeleteError('')

    try {
      // The same call the patient overview makes. One assessment is removed,
      // the patient and their other assessments are untouched.
      await deleteAssessment(target.id)

      setAssessments((current) => current.filter((item) => item.id !== target.id))
      setPendingDelete(null)
      setNotice('Assessment deleted.')

      // Re-read afterwards so what is on screen is what the backend still holds.
      setReloadToken((token) => token + 1)
    } catch (requestError) {
      setDeleteError(
        requestError?.message || 'The assessment could not be deleted. Please try again.',
      )
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Records"
        title="Assessment History"
        subtitle="View previous assessments and activity across your patients."
        status="Assessment Records"
        statusTone="brand"
        backTo={ROUTES.dashboard}
      />

      {isGuest ? (
        <Card className="mt-8 border-warning-100 bg-warning-100/50 p-5">
          <p className="text-sm leading-relaxed text-sage-800">
            Guest assessments are temporary and are not saved to an account, so there is no
            history to show yet. Create an account to keep assessment history.
          </p>
        </Card>
      ) : null}

      {isAuthenticated ? (
        <>
          {/* Search and filters */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="history-search" className="block text-sm font-medium text-sage-900">
                Search
              </label>
              <div className="relative mt-1.5">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <input
                  id="history-search"
                  name="search"
                  type="search"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search patient or patient ID..."
                  className="w-full appearance-none rounded-xl border border-line-strong bg-surface-warm py-2.5 pr-4 pl-11 text-sm text-ink-900 transition-colors duration-200 placeholder:text-ink-400 hover:border-sage-400 focus:border-plum-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500"
                />
              </div>
            </div>

            <div className="sm:w-56">
              <Select
                id="history-type"
                label="Assessment type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                options={TYPE_FILTERS}
              />
            </div>
          </div>

          {notice ? (
            <div
              role="status"
              className="animate-fade-in mt-4 flex items-center gap-2.5 rounded-xl border border-success-500/30 bg-success-100 px-4 py-3"
            >
              <CheckCircle2 className="h-4 w-4 text-success-700" aria-hidden="true" />
              <p className="text-sm text-success-700">{notice}</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-6 space-y-3" aria-busy="true">
              <p className="inline-flex items-center gap-2 text-sm text-ink-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading assessment history...
              </p>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <Card className="mt-6 border border-error-100 p-6 sm:p-8">
              <div className="flex flex-col items-center px-4 py-6 text-center" role="alert">
                <h2 className="text-base font-semibold tracking-tight text-sage-900">
                  Unable to load assessment history.
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                  The saved assessments could not be read from the server.
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className={buttonClasses({ variant: 'primary', size: 'sm', className: 'mt-5' })}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </button>
              </div>
            </Card>
          ) : null}

          {!isLoading && !loadError && !hasAssessments ? (
            <Card className="mt-6 p-6 sm:p-8">
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-sage-600"
                  aria-hidden="true"
                >
                  <HistoryIcon className="h-6 w-6" />
                </span>

                <h2 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                  No assessment history yet
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                  Completed X-ray, Symptoms, and Gait assessments will appear here.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to={ROUTES.xray} className={buttonClasses({ variant: 'secondary' })}>
                    Select Patient
                  </Link>
                  <Link to={ROUTES.xray} className={buttonClasses({ variant: 'primary' })}>
                    Start X-Ray Assessment
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          {!isLoading && !loadError && hasAssessments && visible.length === 0 ? (
            <Card className="mt-6 p-6 sm:p-8">
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-muted text-ink-400"
                  aria-hidden="true"
                >
                  <Search className="h-6 w-6" />
                </span>

                <h2 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                  No matching assessments
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                  Try a different patient name, ID, or assessment type.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-6' })}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Clear Filters
                </button>
              </div>
            </Card>
          ) : null}

          {!isLoading && !loadError && visible.length > 0 ? (
            <section aria-label="Assessment timeline" className="mt-6">
              <p className="text-sm text-ink-500">
                {visible.length} {visible.length === 1 ? 'assessment' : 'assessments'} across{' '}
                {new Set(visible.map((entry) => entry.patient_id)).size}{' '}
                {new Set(visible.map((entry) => entry.patient_id)).size === 1 ? 'patient' : 'patients'}
                {filtersAreActive ? ' matching your search' : ''}
              </p>

              {groups.map((group) => (
                <div key={group.label} className="mt-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[0.68rem] font-semibold tracking-[0.16em] text-ink-400 uppercase">
                      {group.label}
                    </h2>
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  </div>

                  <ol className="mt-3 space-y-3">
                    {group.items.map((assessment) => {
                      const meta = typeMeta(assessment.type)
                      const TypeIcon = meta.icon
                      const patient = patientById.get(assessment.patient_id)

                      return (
                        <li key={assessment.id}>
                          <Card className="p-5 transition-colors duration-200 hover:border-plum-200">
                            <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
                              <span
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${meta.accent}`}
                                aria-hidden="true"
                              >
                                <TypeIcon className="h-5 w-5" />
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                                  <Badge tone={meta.tone}>{meta.label}</Badge>
                                  <p className="text-sm font-semibold text-sage-900">
                                    {patient?.name || assessment.patient_id}
                                  </p>
                                  <span className="text-xs text-ink-400">
                                    {assessment.patient_id}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                                  {statusFor(assessment)}
                                </p>
                                <p className="mt-1 text-xs text-ink-400">
                                  {formatDateTime(assessment.created_at)}
                                </p>
                              </div>

                              <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => handleViewReport(assessment)}
                                  disabled={Boolean(deletingId)}
                                  className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                                >
                                  <FileText className="h-4 w-4" aria-hidden="true" />
                                  View Report
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteError('')
                                    setPendingDelete(assessment)
                                  }}
                                  disabled={Boolean(deletingId)}
                                  className={buttonClasses({ variant: 'danger', size: 'sm' })}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </Card>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this assessment?"
        description="This assessment and its stored results will be permanently removed."
        error={deleteError}
        isBusy={Boolean(deletingId)}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </div>
  )
}
