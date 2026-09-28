import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, UserPlus, ArrowLeft, ScanLine, ClipboardList, Footprints } from 'lucide-react'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/EmptyState'
import { buttonClasses } from '../components/ui/buttonStyles'
import { usePatient } from '../hooks/usePatient'
import { listAssessments } from '../services/assessmentService'
import { formatAssessmentDate, describePatient } from '../constants/format'
import { resultHeadline } from '../constants/resultCopy'
import { ROUTES } from '../routes'

const MODULE_LABELS = {
  xray: 'X-Ray Assessment',
  symptoms: 'Symptoms Assessment',
  gait: 'Gait Assessment',
}

export default function Reports() {
  const { patient } = usePatient()
  const navigate = useNavigate()

  const [assessments, setAssessments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!patient) {
      setAssessments([])
      return
    }

    const controller = new AbortController()
    let mounted = true

    listAssessments(patient.patient_id, { signal: controller.signal })
      .then((data) => {
        if (mounted) {
          setAssessments(data)
          setIsLoading(false)
          setError('')
        }
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || !mounted) return
        setError('Failed to load assessments. Please try again.')
        setIsLoading(false)
      })

    setIsLoading(true)

    return () => {
      mounted = false
      controller.abort()
    }
  }, [patient])

  const handleSelectPatient = () => {
    navigate(ROUTES.xray)
  }

  const handleStartNewAssessment = () => {
    if (!patient) return
    navigate(ROUTES.xray, { state: { startNewXray: true } })
  }

  const handleViewReport = (assessment) => {
    navigate(`${ROUTES.report}?assessment_id=${encodeURIComponent(assessment.id)}`)
  }

  const handleBackToPatient = () => {
    navigate(ROUTES.xray)
  }

  // State 1: No patient selected
  if (!patient) {
    return (
      <div className="container-page py-10 sm:py-12">
        <PageHeader
          eyebrow="Output"
          title="Reports"
          subtitle="View assessment reports for your patients."
          status="Patient not selected"
          statusTone="neutral"
          backTo={ROUTES.dashboard}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <EmptyState
            icon={UserPlus}
            tone="plum"
            title="Select a patient"
            description="Select a patient to view their assessment reports."
            action={
              <button
                type="button"
                onClick={handleSelectPatient}
                className={buttonClasses({ variant: 'primary' })}
              >
                Select Patient
              </button>
            }
          />

          <Card className="h-fit p-6 sm:p-8">
            <h2 className="text-base font-semibold text-sage-900">How reports work</h2>
            <p className="mt-1.5 text-sm text-ink-500">
              Reports are organized by patient. Select a patient to view their X-ray, Symptoms, and future Gait assessments.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sage-200 bg-sage-50 text-sage-600">
                  <ScanLine className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-sage-900">X-Ray Assessment</p>
                  <p className="text-sm text-ink-500">AI-assisted preliminary assessment from knee radiographs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sage-200 bg-sage-50 text-sage-600">
                  <ClipboardList className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-sage-900">Symptoms Assessment</p>
                  <p className="text-sm text-ink-500">Recorded symptom questionnaire responses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sage-200 bg-sage-50 text-sage-600">
                  <Footprints className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-sage-900">Gait Assessment</p>
                  <p className="text-sm text-ink-500">Future module for gait analysis (not yet implemented).</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // State 2: Patient selected, no assessments
  if (!isLoading && !error && assessments.length === 0) {
    return (
      <div className="container-page py-10 sm:py-12">
        <PageHeader
          eyebrow="Output"
          title="Reports"
          subtitle="View assessment reports for this patient."
          status={patient.name}
          statusTone="brand"
          backTo={ROUTES.dashboard}
        />

        <div className="mt-8 max-w-2xl">
          <EmptyState
            icon={FileText}
            tone="plum"
            title="No assessments yet"
            description={`${patient.name} has no completed assessments yet.`}
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleStartNewAssessment}
                  className={buttonClasses({ variant: 'primary' })}
                >
                  Start New Assessment
                </button>
                <button
                  type="button"
                  onClick={handleBackToPatient}
                  className={buttonClasses({ variant: 'secondary' })}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Patient
                </button>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  // State 3: Patient selected with assessments (or loading/error)
  return (
    <div className="container-page py-10 sm:py-12 max-w-[92rem]">
      <PageHeader
        eyebrow="Output"
        title="Reports"
        subtitle="View assessment reports for this patient."
        status={patient.name}
        statusTone="brand"
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 space-y-6">
        {/* Patient Header */}
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
                Assessment Reports
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-sage-900 sm:text-2xl">
                {patient.name}
              </h2>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
                <span className="font-medium text-plum-700">{patient.patient_id}</span>
                {describePatient(patient) ? <span>• {describePatient(patient)}</span> : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleStartNewAssessment}
                className={buttonClasses({ variant: 'primary', size: 'sm' })}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                New Assessment
              </button>
              <button
                type="button"
                onClick={handleBackToPatient}
                className={buttonClasses({ variant: 'ghost', size: 'sm' })}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Patient
              </button>
            </div>
          </div>
        </Card>

        {/* Assessments List */}
        {isLoading ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center" aria-busy="true">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-sage-200 border-t-sage-600" aria-hidden="true" />
            <p className="mt-4 text-sm text-ink-500">Loading assessments...</p>
          </Card>
        ) : error ? (
          <Card className="px-6 py-10 text-center">
            <div
              role="alert"
              className="mx-auto flex max-w-md gap-3 rounded-xl border border-error-100 bg-error-100 px-4 py-3 text-left"
            >
              <span className="mt-0.5 h-4 w-4 shrink-0 text-error-700" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <p className="text-sm text-error-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError('')
                setIsLoading(true)
                const controller = new AbortController()
                listAssessments(patient.patient_id, { signal: controller.signal })
                  .then((data) => {
                    setAssessments(data)
                    setIsLoading(false)
                  })
                  .catch((err) => {
                    if (err?.name !== 'AbortError') {
                      setError('Failed to load assessments. Please try again.')
                      setIsLoading(false)
                    }
                  })
              }}
              className={buttonClasses({ variant: 'secondary', className: 'mt-5' })}
            >
              Try again
            </button>
          </Card>
        ) : (
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {assessments.map((assessment) => (
                <li key={assessment.id}>
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 hover:bg-sage-50/40 transition-colors duration-200">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-sage-900">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-sage-200 bg-sage-50 text-sage-600"
                          aria-hidden="true"
                        >
                          {assessment.type === 'xray' ? <ScanLine className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                        </span>
                        {MODULE_LABELS[assessment.type] ?? 'Assessment'}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {formatAssessmentDate(assessment.created_at)}
                      </p>
                      <p className="mt-1.5 text-sm text-ink-700">
                        Result:{' '}
                        {assessment.xray
                          ? resultHeadline(assessment.xray.oa_indication)
                          : assessment.symptoms
                          ? 'Responses recorded'
                          : 'No data'}
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
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}