import { request } from './api'

/**
 * Auth API calls. The base URL comes from VITE_API_URL (see api.js), so signup
 * posts to ${VITE_API_URL}/api/auth/signup.
 */
export function signup({ fullName, email, password }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: { fullName, email, password },
  })
}
