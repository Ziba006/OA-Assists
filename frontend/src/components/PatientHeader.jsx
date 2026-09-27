import { ArrowLeft, UserRound } from 'lucide-react'
import Card from './ui/Card'
import { buttonClasses } from './ui/buttonStyles'

/**
 * Compact header shown above the X-ray upload once a patient is selected.
 *
 * The patient id comes from the backend and is displayed, never edited. The
 * header is deliberately small: the upload section stays the focus. `title`
 * names what is about to happen ("New X-Ray Assessment") and `onBack` returns to
 * the patient's overview, while "Change Patient" is the way back to the
 * selection list.
 */
export default function PatientHeader({ patient, title, onBack, onChange }) {
  if (!patient) return null

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sage-200 bg-sage-50 text-sage-600"
          aria-hidden="true"
        >
          <UserRound className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          {title ? (
            <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">{title}</p>
          ) : null}

          <p className="truncate text-sm font-semibold text-sage-900">
            <span className="font-normal text-ink-500">Patient: </span>
            {patient.name} &middot; {patient.patient_id}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onBack ? (
          <button type="button" onClick={onBack} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Patient Overview
          </button>
        ) : null}

        {onChange ? (
          <button
            type="button"
            onClick={onChange}
            className={buttonClasses({ variant: 'ghost', size: 'sm' })}
          >
            Change Patient
          </button>
        ) : null}
      </div>
    </Card>
  )
}
