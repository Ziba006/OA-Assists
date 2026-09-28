import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, Save } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import PatientContextBar from '../components/PatientContextBar'
import SymptomQuestionnaire from '../components/SymptomQuestionnaire'
import { buttonClasses } from '../components/ui/buttonStyles'
import { usePatient } from '../hooks/usePatient'
import { countAnswered, isQuestionnaireComplete, REQUIRED_SYMPTOM_KEYS } from '../constants/symptomQuestions'
import { saveSymptoms } from '../services/symptomService'
import { ApiError } from '../services/api'
import { DISCLAIMER } from '../constants/resultCopy'
import { ROUTES } from '../routes'

const EMPTY_ANSWERS = REQUIRED_SYMPTOM_KEYS.reduce((answers, key) => ({ ...answers, [key]: '' }), {})

/** Turn a failed save into a short message the user can act on. */
function describeError(error) {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong while saving your responses. Please try again.'
  }

  if (error.status === 0) {
    return 'Cannot reach the OA Assist server. Make sure the backend is running, then try again.'
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.status === 404) {
    return 'That patient is no longer available. Please choose another patient.'
  }

  if (error.status === 422) {
    return 'Some answers were not accepted. Please review the questionnaire and try again.'
  }

  return error.message
}

/**
 * Symptoms assessment.
 *
 * The questionnaire is recorded against the currently selected patient. Nothing
 * is interpreted here: there is no score, no severity and no OA conclusion, and
 * the confirmation says exactly that much.
 *
 * The patient lives in memory only, so a page refresh or a direct visit with no
 * patient selected sends the user back to patient selection rather than showing
 * a form with nowhere to save to.
 */
export default function Symptoms() {
  const { patient } = usePatient()
  const navigate = useNavigate()

  const [answers, setAnswers] = useState(EMPTY_ANSWERS)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(null)

  // Lets an in-flight save be cancelled if the page is left.
  const activeRequest = useRef(null)

  useEffect(
    () => () => {
      activeRequest.current?.abort()
    },
    [],
  )

  // The patient is required, so a missing one is a redirect, not a broken page.
  if (!patient) {
    return <Navigate to={ROUTES.xray} replace />
  }

  const isComplete = isQuestionnaireComplete(answers)
  const answered = countAnswered(answers)
  const total = REQUIRED_SYMPTOM_KEYS.length

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isComplete || isSaving) return

    setError('')
    setIsSaving(true)

    const controller = new AbortController()
    activeRequest.current = controller

    try {
      const assessment = await saveSymptoms(patient.patient_id, answers, {
        signal: controller.signal,
      })

      setSaved(assessment)
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.name === 'AbortError') return

      setError(describeError(requestError))
    } finally {
      activeRequest.current = null
      setIsSaving(false)
    }
  }

  // ---- confirmation -----------------------------------------------------
  if (saved) {
    return (
      <div className="container-page py-10 sm:py-12">
        <PageHeader
          eyebrow="Assessment module"
          title="Symptoms Assessment"
          subtitle="Your responses have been recorded for this patient."
          status="Recorded"
          statusTone="sage"
        />

        <div className="mt-8 space-y-6">
          <PatientContextBar title="Symptoms assessment" />

          <Card className="animate-fade-up p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-success-100 bg-success-100 text-sage-700"
                aria-hidden="true"
              >
                <CheckCircle2 className="h-7 w-7" />
              </span>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-sage-900">
                  Symptoms recorded
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                  Your responses have been saved for {patient.name} &middot; {patient.patient_id}.
                </p>
              </div>
            </div>

            <p className="mt-5 rounded-xl border border-line bg-surface-muted px-4 py-3 text-xs leading-relaxed text-ink-500">
              Your answers were stored exactly as given. They have not been scored and no conclusion
              has been drawn from them. {DISCLAIMER}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to={ROUTES.report}
                className={buttonClasses({ variant: 'primary', size: 'md', className: 'w-full' })}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                View Full Report
              </Link>

              <Link
                to={ROUTES.xray}
                className={buttonClasses({ variant: 'secondary', size: 'md', className: 'w-full' })}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Patient
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ---- questionnaire ----------------------------------------------------
  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Assessment module"
        title="Symptoms Assessment"
        subtitle="Answer the questions about your knee. Your responses are recorded, not diagnosed."
        status="Questionnaire"
        statusTone="brand"
      />

      <div className="mt-8 space-y-6">
        <PatientContextBar title="Symptoms assessment" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              <span className="font-medium text-sage-900">
                {answered} of {total}
              </span>{' '}
              questions answered
            </p>

            <Badge tone={isComplete ? 'success' : 'neutral'} dot>
              {isComplete ? 'Ready to save' : 'All questions required'}
            </Badge>
          </div>

          <p className="mt-1.5 text-xs text-ink-400">
            Questions marked <span className="text-error-700">*</span> are required.
          </p>

          <div className="mt-6">
            <SymptomQuestionnaire
              answers={answers}
              onChange={setAnswers}
              disabled={isSaving}
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-xl border border-error-100 bg-error-100 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-700" aria-hidden="true" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!isComplete || isSaving}
              className={buttonClasses({ variant: 'primary', size: 'md', className: 'w-full sm:w-auto' })}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save Symptoms
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.xray)}
              disabled={isSaving}
              className={buttonClasses({ variant: 'ghost', size: 'md' })}
            >
              Back to Patient
            </button>
          </div>
        </form>

        <p className="text-xs leading-relaxed text-ink-400">{DISCLAIMER}</p>
      </div>
    </div>
  )
}
