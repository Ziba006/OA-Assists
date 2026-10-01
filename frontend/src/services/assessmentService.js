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
    // Gait is not implemented, so this is always null today. It is read from the
    // response rather than assumed, so the report can show a real gait finding
    // the day the module exists without anyone having to write a placeholder.
    gait: raw.gait ? { ...raw.gait } : null,
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

/**
 * GET /api/assessments/{assessmentId}
 *
 * Reads one assessment back from the server rather than reusing a copy already
 * on the client, so the report page always shows what the backend has
 * confirmed this account may read. The backend resolves the id against the
 * signed-in user and answers 404 for anybody else's assessment.
 *
 * Returns null when the assessment no longer exists.
 */
export async function getAssessment(assessmentId, { signal } = {}) {
  if (!assessmentId) return null

  try {
    return toAssessment(await authRequest(`/api/assessments/${encodeURIComponent(assessmentId)}`, { signal }))
  } catch (error) {
    // A deleted or foreign assessment is simply not reportable; the caller
    // shows the not-found state rather than a transport error.
    if (error?.status === 404) return null

    throw error
  }
}

/**
 * DELETE /api/assessments/{assessmentId}
 *
 * Removes one assessment. The patient is never touched, and the backend
 * refuses with 404 when the assessment belongs to a different account.
 *
 * Returns the confirmation the API sends back, so a caller can check that the
 * row it removed from its list is really the row the server deleted.
 */
export async function deleteAssessment(assessmentId) {
  if (!assessmentId) throw new Error('An assessment id is required to delete an assessment.')

  return authRequest(`/api/assessments/${encodeURIComponent(assessmentId)}`, { method: 'DELETE' })
}
