import { authRequest } from './api'

/**
 * X-ray assessment service.
 *
 * `analyzeXray` sends the selected image to the FastAPI endpoint as
 * multipart/form-data. The base URL comes from VITE_API_URL (see api.js) and the
 * JWT is attached by `authRequest`, because the endpoint requires a signed-in
 * user.
 *
 * The image is uploaded for inference only: it is not stored in the browser and
 * the backend does not persist it.
 */
export function analyzeXray(file, { signal } = {}) {
  const formData = new FormData()
  formData.append('file', file, file.name)

  return authRequest('/api/assessment/xray', { method: 'POST', body: formData, signal })
}
