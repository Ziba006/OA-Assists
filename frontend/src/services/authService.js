import { authRequest, request } from './api'
import { saveSession } from './tokenStorage'

/**
 * Auth API calls. The base URL comes from VITE_API_URL (see api.js), so login
 * posts to ${VITE_API_URL}/api/auth/login and signup to
 * ${VITE_API_URL}/api/auth/signup.
 */
export function signup({ fullName, email, password }) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: { fullName, email, password },
  })
}

/**
 * Log in and remember the session.
 *
 * The backend answers with {message, user, access_token, token_type}. Only the
 * token and the public user fields are stored; the password is never kept, and
 * the returned user object never contains a password or a hash.
 */
export async function login({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  saveSession({ accessToken: data?.access_token, user: data?.user })

  return {
    user: data?.user ?? null,
    accessToken: data?.access_token ?? null,
  }
}

/**
 * Read the signed-in user from the backend, using the stored token.
 * `authRequest` adds the Authorization header and clears the session on a 401.
 */
export function getCurrentUser() {
  return authRequest('/api/auth/me')
}
