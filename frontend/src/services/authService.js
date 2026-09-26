import { request } from './api'

/**
 * Auth API calls. The base URL comes from VITE_API_BASE_URL (see api.js).
 */
export function signup({ fullName, email, password }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: { fullName, email, password },
  })
}
