/**
 * Token storage for OA Assist.
 *
 * The JWT returned by POST /api/auth/login and a minimal copy of the signed-in
 * user are kept in localStorage, so a page refresh does not sign the user out.
 *
 * What is stored:
 * - `oa-assist.accessToken` — the JWT.
 * - `oa-assist.user` — only {id, fullName, email}, exactly what the frontend
 *   needs to render the header.
 *
 * What is never stored: the password, the password hash, `MONGO_URI` or
 * `JWT_SECRET`. None of them ever reach the browser, and the frontend only ever
 * receives the access token and the public user fields.
 *
 * A JWT is readable by any script on the page, so the backend keeps it short
 * lived (JWT_EXPIRE_MINUTES) and a logout endpoint is added later. Guest mode
 * does not use this module at all, which keeps guest data out of storage.
 */

const ACCESS_TOKEN_KEY = 'oa-assist.accessToken'
const USER_KEY = 'oa-assist.user'

const unauthorizedListeners = new Set()

/** localStorage throws in private browsing modes, so every access is guarded. */
function readItem(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage is unavailable: the session then lasts until the tab is closed.
  }
}

function removeItem(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

export function getAccessToken() {
  return readItem(ACCESS_TOKEN_KEY)
}

export function getStoredUser() {
  const raw = readItem(USER_KEY)

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)

    // Only keep the three public fields, whatever happens to be in storage.
    if (!parsed?.id || !parsed?.email) return null

    return { id: parsed.id, fullName: parsed.fullName ?? '', email: parsed.email }
  } catch {
    return null
  }
}

/** True when a token is present, i.e. the user is probably signed in. */
export function hasSession() {
  return Boolean(getAccessToken())
}

/**
 * Remember a successful login. The password is not part of the payload, and any
 * field other than id, fullName and email is dropped.
 */
export function saveSession({ accessToken, user }) {
  if (!accessToken) return

  writeItem(ACCESS_TOKEN_KEY, accessToken)

  if (user?.id && user?.email) {
    writeItem(
      USER_KEY,
      JSON.stringify({ id: user.id, fullName: user.fullName ?? '', email: user.email }),
    )
  }
}

/** Forget the session. Used when a token is rejected; logout is a later step. */
export function clearSession() {
  removeItem(ACCESS_TOKEN_KEY)
  removeItem(USER_KEY)
}

/**
 * Listen for a rejected token, so React state can follow storage.
 * Returns the unsubscribe function.
 */
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

/** Tell every listener that the stored token is no longer valid. */
export function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener())
}
