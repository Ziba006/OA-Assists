/**
 * Shared API layer for OA Assist.
 *
 * The base URL is never hardcoded. It comes from the VITE_API_URL environment
 * variable, which Vite loads from an env file in the frontend root:
 *
 *   VITE_API_URL=https://oa-assists-9mta.vercel.app
 *
 * Copy .env.example to .env.local for local development (see frontend/README.md).
 * Every service (signup, gait, x-ray) builds its URLs here, so no endpoint is
 * hardcoded outside this file.
 */
import { clearSession, getAccessToken, notifyUnauthorized } from './tokenStorage'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'

const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim()

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, fieldErrors = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

/** True when an API address is available, so the app knows the API is reachable. */
export function isApiConfigured() {
  return Boolean(API_BASE_URL)
}

function getBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError(
      'The API address is not configured. Add VITE_API_URL to frontend/.env.local and restart the dev server.',
    )
  }

  return API_BASE_URL.replace(/\/$/, '')
}

async function parseJson(response) {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function request(path, { method = 'GET', body, signal, headers } = {}) {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  let response

  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    // fetch only rejects when the server could not be reached at all.
    throw new ApiError('Cannot reach the OA Assist server. Make sure the backend is running.', {
      status: 0,
    })
  }

  const payload = await parseJson(response)

  if (!response.ok) {
    // FastAPI validation errors arrive as a list of {loc, msg} objects.
    const fieldErrors = Array.isArray(payload?.detail)
      ? Object.fromEntries(
          payload.detail.map((item) => [String(item.loc?.at(-1) ?? 'form'), item.msg]),
        )
      : null

    const message =
      typeof payload?.detail === 'string' ? payload.detail : `Request failed (${response.status}).`

    throw new ApiError(message, { status: response.status, fieldErrors })
  }

  return payload
}

/**
 * Authenticated counterpart of `request`.
 *
 * It attaches `Authorization: Bearer <access_token>` to every call when a token
 * is stored, so a protected call is written as `authRequest('/api/auth/me')`
 * and never has to handle the header. This is the mechanism Axios interceptors
 * would provide in a project that used Axios; this project uses `fetch`.
 *
 * A `401` means the token is missing, expired or rejected, so the stored session
 * is dropped and listeners are notified. That lets AuthContext mark the user as
 * signed out, which is what a future route guard would redirect on.
 */
export async function authRequest(path, options = {}) {
  const token = getAccessToken()

  try {
    return await request(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSession()
      notifyUnauthorized()
    }

    throw error
  }
}

export const api = { request, authRequest }
