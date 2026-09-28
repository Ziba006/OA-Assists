import { useEffect, useState } from 'react'
import { CalendarClock, CheckCircle2, FileText, Loader2, Plus, ScanLine, Trash2 } from 'lucide-react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import ConfirmDialog from './ui/ConfirmDialog'
import { buttonClasses } from './ui/buttonStyles'
import { resultHeadline } from '../constants/resultCopy'
import { describePatient, formatAssessmentDate } from '../constants/format'

const MODULE_LABELS = {
  xray: 'X-Ray Assessment',
  symptoms: 'Symptoms Assessment',
  gait: 'Gait Assessment',
}

/** How long the "Assessment deleted" confirmation stays on screen. */
const TOAST_MS = 4000

/**
 * Patient Overview.
 *
 * Reached by picking a patient from the selection list. It shows that patient's
 * real saved history and nothing else: the list comes from
 * GET /api/assessments?patient_id=..., so an empty list genuinely means no
 * assessments exist yet. Nothing is faked or back-filled.
 *
 * Each row can be opened or deleted. Deleting removes one assessment and only
 * that assessment: the patient, and the patient's other assessments, are
 * untouched. The row disappears from the list as soon as the backend confirms
 * the delete, and the list is re-read afterwards so what is on screen is what
 * is actually stored.
 */
export default function PatientOverview({
  patient,
  assessments = [],
  isLoading = false,
  error = '',
  onRetry,
  onNewAssessment,
  onViewReport,
  onDeleteAssessment,
  onChangePatient,
}) {
  // The assessment awaiting confirmation, and the id currently being deleted.
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingId, setDeletingId] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return undefined

    const timer = setTimeout(() => setNotice(''), TOAST_MS)

    return () => clearTimeout(timer)
  }, [notice])

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
      await onDeleteAssessment?.(target)
      setPendingDelete(null)
      setNotice(
        target.type === 'symptoms'
          ? 'Symptom questionnaire deleted.'
          : 'X-ray assessment deleted.',
      )
    } catch (requestError) {
      setDeleteError(
        requestError?.message || 'The assessment could not be deleted. Please try again.',
      )
    } finally {
      setDeletingId('')
    }
  }

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

      {notice ? (
        <div
          role="status"
          className="animate-fade-in mt-6 flex items-center gap-2.5 rounded-xl border border-success-500/30 bg-success-100 px-4 py-3"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success-700" aria-hidden="true" />
          <p className="text-sm text-success-700">{notice}</p>
        </div>
      ) : null}

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
            {assessments.map((assessment) => {
              const isDeleting = deletingId === assessment.id

              return (
                <li key={assessment.id}>
                  <div
                    className={
                      isDeleting
                        ? 'flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-muted px-4 py-4 opacity-60'
                        : 'flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-muted px-4 py-4'
                    }
                  >
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
                          : // Symptoms are recorded, not interpreted, so the row says
                            // only that the responses exist.
                            'Responses recorded'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewReport?.(assessment)}
                        disabled={isDeleting}
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
                        disabled={isDeleting}
                        className={buttonClasses({ variant: 'danger', size: 'sm' })}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
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

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this assessment?"
        description="This assessment and its stored results will be permanently removed."
        error={deleteError}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isBusy={Boolean(deletingId)}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </Card>
  )
}
