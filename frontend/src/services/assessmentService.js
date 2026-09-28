import { authRequest } from './api'

/**
 * Assessment history service.
 *
 * Saving happens implicitly: `POST /api/assessment/xray` stores the result
 * against the selected patient and returns the saved assessment, so there is no
 * separate "save" call to get wrong.
 *
 * MongoDB is the source of truth. Nothing is cached in localStorage, and no
 * assessment is ever invented on the client: an empty list really does mean the
 * patient has no saved assessments.
 */

/** Normalize one stored assessment so the UI always sees the same shape. */
function toAssessment(raw) {
  if (!raw?.id) return null

  return {
    id: raw.id,
    patient_id: raw.patient_id,
    type: raw.type,
    xray: raw.xray
      ? {
          predicted_class: raw.xray.predicted_class,
          oa_indication: Boolean(raw.xray.oa_indication),
          confidence: raw.xray.confidence,
          probabilities: raw.xray.probabilities ?? {},
          interpretation: raw.xray.interpretation,
          note: raw.xray.note,
        }
      : null,
    // Recorded answers, kept exactly as stored. Nothing is derived from them.
    symptoms: raw.symptoms ? { ...raw.symptoms } : null,
    created_at: raw.created_at,
  }
}

/**
 * GET /api/assessments[?patient_id=OA-0001]
 *
 * Without `patientId` this returns every assessment of the signed-in user. The
 * backend always scopes the query to the authenticated user, so no `user_id` is
 * ever sent from here.
 */
export async function listAssessments(patientId, { signal } = {}) {
  const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : ''
  const payload = await authRequest(`/api/assessments${query}`, { signal })

  return Array.isArray(payload?.assessments)
    ? payload.assessments.map(toAssessment).filter(Boolean)
    : []
}
