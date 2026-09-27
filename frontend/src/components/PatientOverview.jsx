import { CalendarClock, FileText, Loader2, Plus, ScanLine } from 'lucide-react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import { buttonClasses } from './ui/buttonStyles'
import { resultHeadline } from '../constants/resultCopy'
import { describePatient, formatAssessmentDate } from '../constants/format'

const MODULE_LABELS = {
  xray: 'X-Ray Assessment',
  symptoms: 'Symptoms Assessment',
  gait: 'Gait Assessment',
}

/**
 * Patient Overview.
 *
 * Reached by picking a patient from the selection list. It shows that patient's
 * real saved history and nothing else: the list comes from
 * GET /api/assessments?patient_id=..., so an empty list genuinely means no
 * assessments exist yet. Nothing is faked or back-filled.
 */
export default function PatientOverview({
  patient,
  assessments = [],
  isLoading = false,
  error = '',
  onRetry,
  onNewAssessment,
  onViewReport,
  onChangePatient,
}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
            Patient Overview
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
          <Badge tone="sage">{MODULE_LABELS.xray.replace(' Assessment', '')} ready</Badge>
          {onChangePatient ? (
            <button
              type="button"
              onClick={onChangePatient}
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Change Patient
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div
          className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-surface-muted px-6 py-12 text-center"
          aria-busy="true"
        >
          <Loader2 className="h-6 w-6 animate-spin text-plum-500" aria-hidden="true" />
          <p className="mt-3 text-sm text-ink-500">Loading assessment history...</p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-8 flex gap-3 rounded-xl border border-error-100 bg-error-100 px-4 py-3"
        >
          <p className="text-sm text-error-700">{error}</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface-muted px-6 py-12 text-center">
          <CalendarClock className="mx-auto h-7 w-7 text-ink-400" aria-hidden="true" />
          <p className="mt-3 text-sm text-ink-500">No previous assessments yet.</p>
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-sage-900">Previous Assessments</h3>

          <ul className="mt-4 space-y-3">
            {assessments.map((assessment) => (
              <li key={assessment.id}>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-muted px-4 py-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-sage-900">
                      <ScanLine className="h-4 w-4 text-sage-600" aria-hidden="true" />
                      {MODULE_LABELS[assessment.type] ?? 'Assessment'}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatAssessmentDate(assessment.created_at)}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-700">
                      Result:{' '}
                      {assessment.xray
                        ? resultHeadline(assessment.xray.oa_indication)
                        : 'Result unavailable'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewReport(assessment)}
                    className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    View Report
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={buttonClasses({ variant: 'secondary', className: 'mt-5' })}
        >
          Try again
        </button>
      ) : null}

      <button
        type="button"
        onClick={onNewAssessment}
        disabled={isLoading}
        className={buttonClasses({ variant: 'primary', className: 'mt-6 w-full' })}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {assessments.length === 0 ? 'Start New Assessment' : '+ New Assessment'}
      </button>
    </Card>
  )
}
