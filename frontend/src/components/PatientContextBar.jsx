import { Link } from 'react-router-dom'
import { ArrowLeft, UserRound } from 'lucide-react'
import Card from './ui/Card'
import { buttonClasses } from './ui/buttonStyles'
import { usePatient } from '../hooks/usePatient'
import { ROUTES } from '../routes'

/**
 * The patient a module page is working with.
 *
 * The patient lives in memory only, so a page refresh leaves it unset. Rather
 * than crashing or silently showing the wrong patient, this renders a way back
 * to patient selection. Nothing about the patient is put in the URL.
 */
export default function PatientContextBar({ title, onChange }) {
  const { patient } = usePatient()

  if (!patient) {
    return (
      <Card className="px-6 py-10 text-center sm:px-8">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-muted text-ink-400"
          aria-hidden="true"
        >
          <UserRound className="h-6 w-6" />
        </span>

        <h2 className="mt-5 text-base font-semibold text-sage-900">No patient selected</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
          {title} is linked to a patient record. Choose a patient to continue, or run a new X-ray
          assessment first.
        </p>

        <Link
          to={ROUTES.xray}
          className={buttonClasses({ variant: 'primary', className: 'mt-6 inline-flex' })}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Go to Patient Selection
        </Link>
      </Card>
    )
  }

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
          <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">Patient</p>
          <p className="truncate text-sm font-semibold text-sage-900">
            {patient.name} &middot; {patient.patient_id}
          </p>
        </div>
      </div>

      {onChange ? (
        <button type="button" onClick={onChange} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          Change Patient
        </button>
      ) : null}
    </Card>
  )
}
