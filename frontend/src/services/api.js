/**
 * Placeholder API layer.
 *
 * The backend does not exist yet, so no base URL is hardcoded. The base URL is
 * read from VITE_API_BASE_URL when the API is added:
 *
 *   VITE_API_BASE_URL=https://api.example.com
 *
 * Until then every call fails fast with a clear error instead of pretending a
 * request succeeded.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError('API base URL is not configured. Set VITE_API_BASE_URL to enable API calls.')
  }

  return API_BASE_URL.replace(/\/$/, '')
}

export async function request(path, { method = 'GET', body, signal, headers } = {}) {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  const response = await fetch(url, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, {
      status: response.status,
    })
  }

  return response.status === 204 ? null : response.json()
}

export const api = { request }
