import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  FileText,
  Footprints,
  LayoutGrid,
  Loader2,
  RefreshCw,
  ScanLine,
  UserRound,
  Users,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import ProgressPipeline from '../components/ProgressPipeline'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { useAssessment } from '../hooks/useAssessment'
import { usePatient } from '../hooks/usePatient'
import { listAssessments } from '../services/assessmentService'
import { listPatients, toPatientList } from '../services/patientService'
import { formatAssessmentDate } from '../constants/format'
import { resultHeadline } from '../constants/resultCopy'
import { ROUTES } from '../routes'

const SECTION_LABEL_CLASS =
  'text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-400'

/** The greeting follows the reader's clock, not a fixed string. */
function greetingFor(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'

  return 'Good evening'
}

/**
 * The three modules, kept in one place because the counts, the availability
 * ticks and the quick actions all have to agree on what exists.
 *
 * Gait is listed because the platform has the slot for it, not because it works
 * today: the module is still a placeholder, and the backend has never stored a
 * gait document, so its count is a real zero rather than a missing number.
 */
const MODULES = [
  {
    key: 'xray',
    label: 'X-Ray Assessments',
    shortLabel: 'X-Ray',
    icon: ScanLine,
    accent: 'border-plum-200 bg-plum-50 text-plum-700',
    countClass: 'text-plum-700',
  },
  {
    key: 'symptoms',
    label: 'Symptoms Assessments',
    shortLabel: 'Symptoms',
    icon: ClipboardList,
    accent: 'border-sky-200 bg-sky-50 text-sky-600',
    countClass: 'text-sky-600',
  },
  {
    key: 'gait',
    label: 'Gait Assessments',
    shortLabel: 'Gait',
    icon: Footprints,
    accent: 'border-warning-100 bg-warning-100 text-warning-700',
    countClass: 'text-warning-700',
  },
]

/** A real date label, used by the activity list and the patient summary. */
function activityHeadline(assessment) {
  if (assessment.type === 'xray') {
    // The stored flag, not a fresh reading of the model. If the document has no
    // X-ray payload at all, say what is actually there instead of guessing.
    return assessment.xray
      ? resultHeadline(assessment.xray.oa_indication)
      : 'X-ray assessment recorded'
  }

  if (assessment.type === 'symptoms') return 'Symptoms recorded'

  if (assessment.type === 'gait') {
    return assessment.gait?.result ? String(assessment.gait.result) : 'Gait assessment recorded'
  }

  return 'Assessment recorded'
}

function typeLabel(type) {
  if (type === 'xray') return 'X-Ray'
  if (type === 'symptoms') return 'Symptoms'
  if (type === 'gait') return 'Gait'

  return 'Assessment'
}

function typeTone(type) {
  if (type === 'xray') return 'brand'
  if (type === 'symptoms') return 'neutral'
  if (type === 'gait') return 'sage'

  return 'neutral'
}

function StatCard({ icon: Icon, value, label, accent, countClass, isLoading }) {
  return (
    <Card className="flex items-center gap-4 p-5 sm:p-6">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accent}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        {isLoading ? (
          <span className="block h-8 w-12 animate-pulse rounded-lg bg-surface-muted" aria-hidden="true" />
        ) : (
          <p className={`text-2xl leading-none font-semibold tracking-tight ${countClass}`}>{value}</p>
        )}
        <p className="mt-1.5 text-sm text-ink-500">{label}</p>
      </div>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-surface-muted" aria-hidden="true" />
        <div className="flex-1">
          <span className="block h-8 w-12 animate-pulse rounded-lg bg-surface-muted" aria-hidden="true" />
          <span className="mt-2 block h-3 w-24 animate-pulse rounded bg-surface-muted" aria-hidden="true" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Dashboard.
 *
 * Everything on this page is read from the backend on arrival: the patient's own
 * records from `GET /api/patients` and `GET /api/assessments`, both already
 * scoped to the signed-in account by the API. There is no dashboard endpoint,
 * because those two lists carry everything shown here and adding a third route
 * to return the same rows would only be a second path to the same data.
 *
 * The counts are therefore derived, not stored: patients are counted from the
 * patient list and each module is counted from the assessments that exist. A
 * module with no records shows 0, which is the truth rather than a placeholder.
 *
 * There is no score here. Nothing in the backend produces a risk, severity or
 * health figure, so this page does not invent one, rank patients, or colour a
 * patient by condition. It summarises activity: what has been assessed, for
 * whom, and when.
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const { isAuthenticated, isGuest } = useAuth()
  const { drafts } = useAssessment()
  const { patient: selectedPatient, setPatient } = usePatient()

  const [patients, setPatients] = useState([])
  const [assessments, setAssessments] = useState([])
  const [loadError, setLoadError] = useState(false)

  // Which attempt last finished. Loading is derived from this rather than set
  // inside the effect, so a reload never needs a render to start.
  const [reloadToken, setReloadToken] = useState(0)
  const [settledToken, setSettledToken] = useState(-1)

  // Lets the in-flight load be cancelled when the page is left or retried.
  const activeRequest = useRef(null)

  useEffect(() => {
    // Guest sessions have no account behind them, so there is nothing real to
    // read and nothing to count. They get the module overview instead of
    // numbers that would be invented, and the lists simply stay empty.
    if (!isAuthenticated) return undefined

    const controller = new AbortController()
    activeRequest.current = controller

    // Both lists are needed before anything here can be drawn, so they are
    // fetched together rather than one after the other.
    Promise.all([
      listPatients({ signal: controller.signal }),
      listAssessments(undefined, { signal: controller.signal }),
    ])
      .then(([patientPayload, assessmentPayload]) => {
        if (controller.signal.aborted) return

        setPatients(toPatientList(patientPayload))
        setAssessments(assessmentPayload)
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

  const handleRetry = useCallback(() => {
    setLoadError(false)
    setReloadToken((token) => token + 1)
  }, [])

  const patientNameById = useMemo(() => {
    const names = new Map()

    for (const entry of patients) names.set(entry.patient_id, entry.name)

    return names
  }, [patients])

  // Derived from the assessments themselves, so the numbers and the list below
  // can never disagree with each other.
  const counts = useMemo(
    () => ({
      xray: assessments.filter((entry) => entry.type === 'xray').length,
      symptoms: assessments.filter((entry) => entry.type === 'symptoms').length,
      gait: assessments.filter((entry) => entry.type === 'gait').length,
    }),
    [assessments],
  )

  const recentAssessments = useMemo(() => assessments.slice(0, 5), [assessments])

  const patientAssessments = useMemo(
    () =>
      selectedPatient
        ? assessments.filter((entry) => entry.patient_id === selectedPatient.patient_id)
        : [],
    [assessments, selectedPatient],
  )

  // A guest has nothing to load, so the skeleton never appears for one.
  const isLoading = isAuthenticated && settledToken !== reloadToken
  const hasAssessments = assessments.length > 0

  // X-ray and symptoms need a patient record to save against, so with none
  // selected these two land on patient selection instead of a dead form.
  const goToXray = () => {
    if (selectedPatient) {
      navigate(ROUTES.xray, { state: { startNewXray: true } })
      return
    }

    navigate(ROUTES.xray)
  }

  const goToSymptoms = () => navigate(selectedPatient ? ROUTES.symptoms : ROUTES.xray)
  const goToPatients = () => navigate(ROUTES.xray)

  /**
   * Open one saved assessment in the existing report page.
   *
   * The report page is opened the same way the X-ray and history pages open it,
   * with `?assessment_id=`, and nothing here renders a report of its own. It
   * does need the patient to be the selected one, so the activity row makes that
   * patient current first when it is somebody else. This is the same thing that
   * happens when an assessment is opened from a patient's own overview, and the
   * patient list this page already holds is where that record comes from.
   */
  const handleViewReport = (assessment) => {
    const owner = patients.find((entry) => entry.patient_id === assessment.patient_id)

    if (owner && owner.patient_id !== selectedPatient?.patient_id) setPatient(owner)

    navigate(`${ROUTES.report}?assessment_id=${encodeURIComponent(assessment.id)}`)
  }

  const quickActions = [
    {
      key: 'xray',
      title: 'New X-Ray Assessment',
      description: selectedPatient
        ? `Assess a knee X-ray for ${selectedPatient.name}.`
        : 'Select a patient, then upload a knee X-ray.',
      icon: ScanLine,
      accent: 'border-plum-200 bg-plum-50 text-plum-700',
      onClick: goToXray,
    },
    {
      key: 'symptoms',
      title: 'Add Symptoms',
      description: selectedPatient
        ? 'Record pain, stiffness and mobility answers.'
        : 'Select a patient, then answer the questionnaire.',
      icon: ClipboardList,
      accent: 'border-sky-200 bg-sky-50 text-sky-600',
      onClick: goToSymptoms,
    },
    {
      key: 'reports',
      title: 'View Reports',
      description: 'Read the assessments saved for your patients.',
      icon: FileText,
      accent: 'border-sage-200 bg-sage-50 text-sage-700',
      to: ROUTES.reports,
    },
    {
      key: 'patients',
      title: 'Patients',
      description: 'Choose or switch the patient you are working with.',
      icon: Users,
      accent: 'border-line-strong bg-surface-muted text-ink-700',
      onClick: goToPatients,
    },
  ]

  const greeting = greetingFor()

  return (
    <div className="container-page py-10 sm:py-12">
      {/* Header */}
      <PageHeader
        eyebrow="OA Assist"
        title={greeting}
        subtitle="AI-assisted tools for preliminary osteoarthritis risk assessment."
        actions={
          selectedPatient ? (
            <div className="w-full rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3 sm:w-64">
              <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-sage-700 uppercase">
                Current Patient
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-sage-900">
                {selectedPatient.name}
              </p>
              <p className="text-xs text-ink-500">{selectedPatient.patient_id}</p>
              <button
                type="button"
                onClick={goToPatients}
                className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'mt-2 -ml-3' })}
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Select Patient
              </button>
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-line bg-surface-warm px-4 py-3 sm:w-64">
              <p className="text-sm font-semibold text-sage-900">No patient selected</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                Select a patient to begin an assessment.
              </p>
              <button
                type="button"
                onClick={goToPatients}
                className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-3' })}
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                Select Patient
              </button>
            </div>
          )
        }
      />

      <p className="mt-3 text-xl font-semibold tracking-tight text-sage-900 sm:text-2xl">
        Welcome to OA Assist
      </p>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading" className="mt-10">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="h-5 w-5 text-plum-600" aria-hidden="true" />
          <h2 id="quick-actions-heading" className="text-base font-semibold text-sage-900">
            Quick Actions
          </h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ key, title, description, icon: Icon, accent, to, onClick }) => {
            const content = (
              <>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accent}`}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </span>

                <h3 className="mt-4 text-sm font-semibold text-sage-900">{title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">{description}</p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-plum-700">
                  {title}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </>
            )

            const shared = {
              className:
                'group flex h-full flex-col rounded-2xl border border-line bg-surface-warm p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-plum-300 hover:shadow-lift',
            }

            if (to) {
              return (
                <Link key={key} to={to} {...shared}>
                  {content}
                </Link>
              )
            }

            return (
              <button key={key} type="button" onClick={onClick} {...shared}>
                {content}
              </button>
            )
          })}
        </div>
      </section>

      {/* Guests have no account to read, so they get the module overview
          instead of counts that could only be invented. */}
      {isGuest ? (
        <>
          {/* The session progress indicator guests have always had, kept here
              because without an account it is the only progress they can see. */}
          <Card className="mt-10 p-6 sm:p-8">
            <ProgressPipeline drafts={drafts} />
          </Card>

          <Card className="mt-6 p-6 sm:p-8">
            <div className="flex flex-col items-center px-4 py-6 text-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-sage-600"
                aria-hidden="true"
              >
                <UserRound className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                Sign in to open your dashboard
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                A guest session can explore the modules, but assessments are saved to an account.
                Sign in to see your patients, your assessment counts and your recent activity.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to={ROUTES.login} className={buttonClasses({ variant: 'primary' })}>
                  Sign In
                </Link>
                <Link to={ROUTES.signup} className={buttonClasses({ variant: 'secondary' })}>
                  Create Account
                </Link>
              </div>
              <p className="mt-4 text-xs text-warning-700">
                Guest assessments are temporary and are not saved to an account.
              </p>
            </div>
          </Card>
        </>
      ) : null}

      {isAuthenticated ? (
        <>
          {/* Overview statistics */}
          <section aria-labelledby="overview-heading" className="mt-12">
            <div className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-plum-600" aria-hidden="true" />
              <h2 id="overview-heading" className="text-base font-semibold text-sage-900">
                Overview
              </h2>
            </div>

            {loadError ? (
              <Card className="mt-4 border border-error-100 p-6 sm:p-8">
                <div className="flex flex-col items-center px-4 py-6 text-center" role="alert">
                  <h3 className="text-base font-semibold tracking-tight text-sage-900">
                    Unable to load dashboard data.
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                    The patients and assessments could not be read from the server.
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
            ) : (
              <>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {isLoading ? (
                    [0, 1, 2, 3].map((slot) => <SkeletonCard key={slot} />)
                  ) : (
                    <>
                      <StatCard
                        icon={Users}
                        value={patients.length}
                        label="Total Patients"
                        accent="border-sage-200 bg-sage-50 text-sage-700"
                        countClass="text-sage-800"
                      />
                      {MODULES.map((module) => (
                        <StatCard
                          key={module.key}
                          icon={module.icon}
                          value={counts[module.key]}
                          label={module.label}
                          accent={module.accent}
                          countClass={module.countClass}
                        />
                      ))}
                    </>
                  )}
                </div>

                {isLoading ? (
                  <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-400">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading your patients and assessments...
                  </p>
                ) : null}
              </>
            )}
          </section>

          {/* Recent activity and patient context */}
          {!isLoading && !loadError ? (
            <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
              <section aria-labelledby="recent-activity-heading">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-plum-600" aria-hidden="true" />
                    <h2
                      id="recent-activity-heading"
                      className="text-base font-semibold text-sage-900"
                    >
                      Recent Activity
                    </h2>
                  </div>
                  {hasAssessments ? (
                    <Badge tone="neutral">
                      {assessments.length} {assessments.length === 1 ? 'record' : 'records'}
                    </Badge>
                  ) : null}
                </div>

                {hasAssessments ? (
                  <ul className="mt-4 space-y-3">
                    {recentAssessments.map((assessment) => (
                      <li key={assessment.id}>
                        <Card className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={typeTone(assessment.type)}>
                                  {typeLabel(assessment.type)}
                                </Badge>
                                <p className="truncate text-sm font-semibold text-sage-900">
                                  {patientNameById.get(assessment.patient_id) ||
                                    assessment.patient_id}
                                </p>
                                <span className="text-xs text-ink-400">
                                  {assessment.patient_id}
                                </span>
                              </div>

                              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                                {activityHeadline(assessment)}
                              </p>
                              <p className="mt-1 text-xs text-ink-400">
                                {formatAssessmentDate(assessment.created_at)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleViewReport(assessment)}
                              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                            >
                              <FileText className="h-4 w-4" aria-hidden="true" />
                              View Report
                            </button>
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Card className="mt-4 p-6 sm:p-8">
                    <div className="flex flex-col items-center px-4 py-8 text-center">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-sage-600"
                        aria-hidden="true"
                      >
                        <FileText className="h-6 w-6" />
                      </span>

                      <h3 className="mt-5 text-base font-semibold tracking-tight text-sage-900">
                        No assessments yet
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
                        Start by selecting a patient and completing an assessment.
                      </p>

                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button
                          type="button"
                          onClick={goToPatients}
                          className={buttonClasses({ variant: 'secondary' })}
                        >
                          <UserRound className="h-4 w-4" aria-hidden="true" />
                          Select Patient
                        </button>
                        <button
                          type="button"
                          onClick={goToXray}
                          className={buttonClasses({ variant: 'primary' })}
                        >
                          <ScanLine className="h-4 w-4" aria-hidden="true" />
                          Start X-Ray Assessment
                        </button>
                      </div>
                    </div>
                  </Card>
                )}
              </section>

              <div className="space-y-6">
                <section aria-labelledby="current-patient-heading">
                  <h2
                    id="current-patient-heading"
                    className={SECTION_LABEL_CLASS}
                  >
                    Current Patient
                  </h2>

                  <Card className="mt-3 p-5 sm:p-6">
                    {selectedPatient ? (
                      <>
                        <div className="flex items-start gap-3.5">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-sage-700"
                            aria-hidden="true"
                          >
                            <UserRound className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-sage-900">
                              {selectedPatient.name}
                            </p>
                            <p className="text-sm text-ink-500">{selectedPatient.patient_id}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={goToPatients}
                            className={buttonClasses({ variant: 'primary', size: 'sm' })}
                          >
                            <UserRound className="h-4 w-4" aria-hidden="true" />
                            View Patient
                          </button>
                          <button
                            type="button"
                            onClick={goToPatients}
                            className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                          >
                            Change
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center px-2 py-6 text-center">
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-muted text-ink-400"
                          aria-hidden="true"
                        >
                          <UserRound className="h-5 w-5" />
                        </span>
                        <p className="mt-4 text-sm font-semibold text-sage-900">No patient selected</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                          Select a patient to begin an assessment.
                        </p>
                        <button
                          type="button"
                          onClick={goToPatients}
                          className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-4' })}
                        >
                          <UserRound className="h-4 w-4" aria-hidden="true" />
                          Select Patient
                        </button>
                      </div>
                    )}
                  </Card>
                </section>

                {/*
                  Only rendered when the selected patient has real history, and
                  only from what that history contains: a count, the date of the
                  last record, and which modules have been answered. No score and
                  no interpretation, because nothing in the backend produces one.
                */}
                {selectedPatient && patientAssessments.length > 0 ? (
                  <section aria-labelledby="patient-activity-heading">
                    <h2 id="patient-activity-heading" className={SECTION_LABEL_CLASS}>
                      Patient Activity
                    </h2>

                    <Card className="mt-3 p-5 sm:p-6">
                      <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold tracking-[0.14em] text-ink-400 uppercase">
                            Last assessment
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-sage-900">
                            {formatAssessmentDate(patientAssessments[0].created_at)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold tracking-[0.14em] text-ink-400 uppercase">
                            Assessments
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-sage-900">
                            {patientAssessments.length}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-ink-400 uppercase">
                        Available inputs
                      </p>

                      <ul className="mt-3 space-y-2">
                        {MODULES.map((module) => {
                          const isAvailable = patientAssessments.some(
                            (entry) => entry.type === module.key,
                          )
                          const AvailableIcon = isAvailable ? CheckCircle2 : CircleDashed
                          const ModuleIcon = module.icon

                          return (
                            <li
                              key={module.key}
                              className="flex items-center gap-2.5 text-sm text-ink-600"
                            >
                              <ModuleIcon className="h-4 w-4 text-ink-400" aria-hidden="true" />
                              {module.shortLabel}
                              <AvailableIcon
                                className={`ml-auto h-4 w-4 ${
                                  isAvailable ? 'text-sage-600' : 'text-ink-400'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="sr-only">
                                {isAvailable ? 'recorded' : 'not recorded'}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </Card>
                  </section>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
