import { request } from './api'

/**
 * X-ray assessment service. The AI imaging model is not integrated yet, so these
 * entry points only describe the intended contract and will fail until the
 * backend and VITE_API_URL are provided.
 */
export function analyzeXray(file, { signal } = {}) {
  const formData = new FormData()
  formData.append('image', file)

  return request('/assessments/xray', { method: 'POST', body: formData, signal })
}

export function getXrayAssessment(assessmentId, { signal } = {}) {
  return request(`/assessments/xray/${assessmentId}`, { signal })
}
