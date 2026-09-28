import { authRequest } from './api'

/**
 * Symptoms questionnaire service.
 *
 * `POST /api/assessment/symptoms` records the answers against the selected
 * patient and returns the assessment it stored, so there is no separate read to
 * get out of step. The backend takes the owner from the verified token and checks
 * the patient belongs to the caller, so no `user_id` is ever sent from here.
 *
 * The answers are recorded, not interpreted. Nothing in this module derives a
 * score, a severity or a diagnostic conclusion from them.
 */

/** Shape the request body the endpoint expects. */
export function toSymptomsRequest(patientId, answers) {
  return { patient_id: patientId, symptoms: { ...answers } }
}

/**
 * POST /api/assessment/symptoms
 *
 * Resolves to the saved assessment: `{ assessment_id, patient_id, type,
 * symptoms, created_at }`.
 */
export async function saveSymptoms(patientId, answers, { signal } = {}) {
  const payload = await authRequest('/api/assessment/symptoms', {
    method: 'POST',
    body: toSymptomsRequest(patientId, answers),
    signal,
  })

  return {
    id: payload?.assessment_id ?? null,
    patient_id: payload?.patient_id ?? patientId,
    type: payload?.type ?? 'symptoms',
    symptoms: payload?.symptoms ?? { ...answers },
    created_at: payload?.created_at ?? null,
  }
}
