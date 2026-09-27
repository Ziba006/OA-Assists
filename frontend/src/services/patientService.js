import { authRequest } from './api'

/**
 * Patient service.
 *
 * Thin wrapper over the patient endpoints added in the Patient Management layer.
 * Every call goes through `authRequest`, so the JWT is attached automatically and
 * a `401` clears the session and drops the app back to guest, exactly like the
 * X-ray upload does.
 *
 * MongoDB is the source of truth. Nothing here is cached in localStorage: the
 * list is always re-read from GET /api/patients so a page refresh shows what the
 * backend actually holds.
 */

/** Normalize one API patient so the UI always sees the same field names. */
function toPatient(raw) {
  if (!raw?.patient_id) return null

  return {
    patient_id: raw.patient_id,
    name: raw.name ?? '',
    age: typeof raw.age === 'number' ? raw.age : null,
    gender: raw.gender ?? null,
    created_at: raw.created_at ?? null,
  }
}

/** Normalize the list response, dropping anything unusable. */
export function toPatientList(raw) {
  if (!Array.isArray(raw)) return []

  return raw.map(toPatient).filter(Boolean)
}

/** GET /api/patients - the signed-in user's patients, newest first. */
export function listPatients({ signal } = {}) {
  return authRequest('/api/patients', { signal })
}

/**
 * POST /api/patients - create a patient and return it, id included.
 *
 * Only the fields the form collects are sent. `user_id` is never included: the
 * backend takes ownership from the verified JWT and ignores anything else.
 */
export function createPatient(patient, { signal } = {}) {
  return authRequest('/api/patients', { method: 'POST', body: patient, signal })
}

/** GET /api/patients/{patient_id} */
export function getPatient(patientId, { signal } = {}) {
  return authRequest(`/api/patients/${encodeURIComponent(patientId)}`, { signal })
}

/** DELETE /api/patients/{patient_id} */
export function deletePatient(patientId, { signal } = {}) {
  return authRequest(`/api/patients/${encodeURIComponent(patientId)}`, { method: 'DELETE', signal })
}

export { toPatient }
