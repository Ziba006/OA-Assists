import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Plus, Search, UserPlus, Users } from 'lucide-react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import Input from './ui/Input'
import Select from './ui/Select'
import { buttonClasses } from './ui/buttonStyles'

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
]

const MAX_AGE = 130

const EMPTY_FORM = { name: '', age: '', gender: '' }

/**
 * Patient selection for an assessment.
 *
 * Covers the three cases in one component:
 * - no patients yet: the create form is shown straight away
 * - patients exist: a searchable list, where the whole row opens that patient's
 *   overview and "New Assessment" skips straight to a new X-ray for them
 * - "+ Add New Patient": the same create form, opened from the list
 *
 * Creating a patient calls `onCreate`; opening an overview calls
 * `onSelectPatient`; starting a new X-ray calls `onStartNewAssessment`. All
 * three are decided by the page, so this component holds no data of its own
 * beyond the form fields and the search text. The patient id is assigned by the
 * backend and only ever displayed, never typed.
 */
export default function PatientSelect({
  patients = [],
  isLoading = false,
  loadError = '',
  onRetryLoad,
  isCreating = false,
  createError = '',
  onSelectPatient,
  onStartNewAssessment,
  onCreatePatient,
}) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})

  const hasPatients = patients.length > 0
  // With no patients there is nothing to choose from, so the form is the only
  // thing that can be shown.
  const isFormVisible = isAddingNew || !hasPatients

  const visiblePatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase()

    if (!query) return true

    // Matching on the id as well means "OA-0001" finds the patient directly.
    return (
      patient.name.toLowerCase().includes(query) || patient.patient_id.toLowerCase().includes(query)
    )
  })

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const errors = {}

    if (!form.name.trim()) {
      errors.name = 'Patient name is required.'
    }

    const age = form.age.trim()

    if (age) {
      const parsed = Number(age)

      if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_AGE) {
        errors.age = `Enter an age between 0 and ${MAX_AGE}, or leave it blank.`
      }
    }

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  // A finished create shows up as a new patient in the list. When that happens,
  // drop back out of the form so it is clean for the next time it is opened.
  const previousCount = useRef(patients.length)

  useEffect(() => {
    if (patients.length > previousCount.current) {
      setIsAddingNew(false)
      setForm(EMPTY_FORM)
      setFieldErrors({})
    }

    previousCount.current = patients.length
  }, [patients.length])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (isCreating || !validate()) return

    onCreatePatient({
      name: form.name.trim(),
      // Blank optional fields are sent as null, which the backend stores as unset.
      age: form.age.trim() ? Number(form.age.trim()) : null,
      gender: form.gender || null,
    })
  }

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center" aria-busy="true">
        <Loader2 className="h-7 w-7 animate-spin text-plum-500" aria-hidden="true" />
        <p className="mt-4 text-sm text-ink-500">Loading your patients...</p>
      </Card>
    )
  }

  if (loadError) {
    return (
      <Card className="px-6 py-10 text-center">
        <div
          role="alert"
          className="mx-auto flex max-w-md gap-3 rounded-xl border border-error-100 bg-error-100 px-4 py-3 text-left"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-700" aria-hidden="true" />
          <p className="text-sm text-error-700">{loadError}</p>
        </div>

        {onRetryLoad ? (
          <button
            type="button"
            onClick={onRetryLoad}
            className={buttonClasses({ variant: 'secondary', className: 'mt-5' })}
          >
            Try again
          </button>
        ) : null}
      </Card>
    )
  }

  return (
    <Card className="p-6 sm:p-8">
      {isFormVisible ? (
        <form onSubmit={handleSubmit} noValidate>
          {hasPatients ? (
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false)
                setForm(EMPTY_FORM)
                setFieldErrors({})
              }}
              className={buttonClasses({ variant: 'ghost', size: 'sm', className: '-ml-2' })}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to patients
            </button>
          ) : null}

          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-plum-600"
              aria-hidden="true"
            >
              <UserPlus className="h-7 w-7" />
            </span>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-sage-900">
                {hasPatients ? 'Add a new patient' : 'Who is this assessment for?'}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                {hasPatients
                  ? 'Create another patient to keep this account\'s records separate.'
                  : 'Add the patient this X-ray belongs to. You can add more people later and reuse them.'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="patient-name"
                label="Patient Name"
                value={form.name}
                onChange={updateField('name')}
                placeholder="e.g. Rahul Khan"
                autoComplete="off"
                required
                error={fieldErrors.name}
                disabled={isCreating}
              />
            </div>

            <Input
              id="patient-age"
              label="Age"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_AGE}
              value={form.age}
              onChange={updateField('age')}
              placeholder="Optional"
              error={fieldErrors.age}
              hint="Optional"
              disabled={isCreating}
            />

            <Select
              id="patient-gender"
              label="Gender"
              value={form.gender}
              onChange={updateField('gender')}
              options={GENDER_OPTIONS}
              placeholder="Optional"
              hint="Optional"
              disabled={isCreating}
            />
          </div>

          {createError ? (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-xl border border-error-100 bg-error-100 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-700" aria-hidden="true" />
              <p className="text-sm text-error-700">{createError}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isCreating}
            className={buttonClasses({ variant: 'primary', className: 'mt-6 w-full' })}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating patient...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-sage-900">Select Patient</h2>
            <Badge tone="sage">
              {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
            </Badge>
          </div>

          <p className="mt-1.5 text-sm text-ink-500">
            Pick who this X-ray belongs to. Existing patients are reused, never duplicated.
          </p>

          <div className="relative mt-5">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patients..."
              aria-label="Search patients"
              className="w-full rounded-xl border border-line-strong bg-surface-warm py-2.5 pl-10 pr-4 text-sm text-ink-900 transition-colors duration-200 placeholder:text-ink-400 hover:border-sage-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500"
            />
          </div>

          {visiblePatients.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {visiblePatients.map((patient) => (
                <li key={patient.patient_id}>
                  {/*
                    The whole row opens the patient's overview, so it behaves as
                    one button: clickable, focusable and operable from the
                    keyboard. The "New Assessment" button inside is a separate
                    action and stops propagation, so it never also opens the
                    overview.
                  */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectPatient(patient)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return

                      event.preventDefault()
                      onSelectPatient(patient)
                    }}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface-warm px-4 py-4 transition-colors duration-200 hover:border-sage-300 hover:bg-sage-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sage-200 bg-sage-50 text-sage-600"
                        aria-hidden="true"
                      >
                        <Users className="h-5 w-5" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-sage-900">
                          {patient.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                          <span className="font-medium text-plum-700">{patient.patient_id}</span>
                          {patient.age !== null ? <span>Age {patient.age}</span> : null}
                          {patient.gender ? <span>{patient.gender}</span> : null}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        // Opening a new X-ray directly must not bubble up and
                        // also open the overview underneath.
                        event.stopPropagation()
                        onStartNewAssessment(patient)
                      }}
                      onKeyDown={(event) => event.stopPropagation()}
                      className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                    >
                      New Assessment
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-line bg-surface-muted px-4 py-6 text-center text-sm text-ink-500">
              No patient matches &ldquo;{search.trim()}&rdquo;.
            </p>
          )}

          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className={buttonClasses({ variant: 'ghost', className: 'mt-5 w-full border border-dashed border-line-strong' })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add New Patient
          </button>
        </>
      )}
    </Card>
  )
}
