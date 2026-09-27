/**
 * Formatting helpers for patient and assessment display.
 *
 * Kept out of the component files so a value is formatted the same way wherever
 * it appears: on a history row, in the report, and on the selected-patient
 * header. Every value comes from the API, so a missing or unparsable one is
 * shown as such rather than guessed at.
 */

/** "Age 30 • Female" style summary, omitting anything not recorded. */
export function describePatient(patient) {
  const parts = []

  if (patient?.age !== null && patient?.age !== undefined) parts.push(`Age ${patient.age}`)
  if (patient?.gender) parts.push(patient.gender)

  return parts.join(' • ')
}

/** Date on a history row, for example "27 Sep 2026". */
export function formatAssessmentDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Date and time for the report view, for example "27 Sep 2026, 14:05". */
export function formatDateTime(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
