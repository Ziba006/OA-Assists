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

/**
 * PATCH /api/auth/me - update the signed-in user's own profile.
 *
 * Only the name is sent. The email is the login identity and the backend does
 * not accept it here, so this never offers to change it.
 *
 * Returns the updated safe user (`{id, fullName, email}`) so the caller can put
 * the new name on screen without reloading the page.
 */
export function updateProfile({ fullName }) {
  return authRequest('/api/auth/me', { method: 'PATCH', body: { fullName } })
}

/**
 * POST /api/auth/change-password - change the signed-in user's own password.
 *
 * The current password is required so the account owner is proven, not just
 * whoever has an unlocked session. A wrong current password comes back as a
 * `400` and is reported as an ordinary message: it is deliberately not a `401`,
 * because on this API a `401` clears the stored session, and a typo must not
 * sign anyone out.
 *
 * The passwords live only in the form state and in this request body. They are
 * never stored, never logged, and never placed in a URL.
 */
export function changePassword({ currentPassword, newPassword }) {
  return authRequest('/api/auth/change-password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  })
}
