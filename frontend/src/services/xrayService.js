import { authRequest } from './api'

/**
 * X-ray assessment service.
 *
 * `analyzeXray` sends the selected image to the FastAPI endpoint as
 * multipart/form-data, together with the `patient_id` the result belongs to. The
 * base URL comes from VITE_API_URL (see api.js) and the JWT is attached by
 * `authRequest`, because the endpoint requires a signed-in user.
 *
 * The backend runs the model and saves the result against that patient, then
 * returns the saved assessment (`assessment_id`, `created_at`). The image is
 * used for inference only: it is not kept in the browser and the backend does
 * not persist it.
 */
export function analyzeXray(file, { patientId, signal } = {}) {
  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('patient_id', patientId)

  return authRequest('/api/assessment/xray', { method: 'POST', body: formData, signal })
}
