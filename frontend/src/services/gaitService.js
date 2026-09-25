import { request } from './api'

/**
 * Gait assessment service. The IMU / wearable module arrives in a later stage;
 * these entry points describe the intended contract only.
 */
export function submitGaitSession(session, { signal } = {}) {
  return request('/assessments/gait', { method: 'POST', body: session, signal })
}

export function getGaitAssessment(assessmentId, { signal } = {}) {
  return request(`/assessments/gait/${assessmentId}`, { signal })
}
