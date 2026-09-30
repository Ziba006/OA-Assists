import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser } from '../services/authService'
import {
  clearSession,
  getAccessToken,
  onUnauthorized,
  updateStoredUser,
} from '../services/tokenStorage'

/**
 * The single source of truth for authentication in the app.
 *
 * `status` is one of:
 * - restoring: a token is in storage and GET /api/auth/me is in flight
 * - authenticated: the backend confirmed the token and returned the user
 * - guest: nobody is signed in
 *
 * The stored JWT is never trusted on its own. After a page refresh the token is
 * sent to the backend and the user shown in the UI is the one the backend
 * returns. A `401` clears the token and drops back to guest, which is what
 * `authRequest` does in `services/api.js`.
 */
export const AuthContext = createContext(null)

const AUTH_STATUS = {
  restoring: 'restoring',
  authenticated: 'authenticated',
  guest: 'guest',
}

/** Keep only the three public fields the sidebar and header need. */
function toSessionUser(user) {
  if (!user?.id || !user?.email) return null

  return { id: user.id, fullName: user.fullName ?? '', email: user.email }
}

export function AuthProvider({ children }) {
  // No token means guest straight away, so a guest never sees a loading state.
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() =>
    getAccessToken() ? AUTH_STATUS.restoring : AUTH_STATUS.guest,
  )
  const [isGuest, setIsGuest] = useState(false)

  // Ask the backend who the stored token belongs to. This runs once per page
  // load, so a refresh keeps the session only while the JWT is still valid.
  useEffect(() => {
    if (status !== AUTH_STATUS.restoring) return undefined

    let cancelled = false

    getCurrentUser()
      .then((data) => {
        if (cancelled) return

        const sessionUser = toSessionUser(data)

        if (sessionUser) {
          updateStoredUser(sessionUser)
          setUser(sessionUser)
          setStatus(AUTH_STATUS.authenticated)
        } else {
          setStatus(AUTH_STATUS.guest)
        }
      })
      .catch(() => {
        if (cancelled) return

        // `authRequest` already cleared the session on a 401. Any other failure
        // (backend down) leaves the token in place but shows the guest state
        // rather than claiming to be signed in.
        setStatus(AUTH_STATUS.guest)
      })

    return () => {
      cancelled = true
    }
  }, [status])

  // The backend rejected the token while a request was in flight, so the
  // session is already cleared and React state follows.
  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null)
        setStatus(AUTH_STATUS.guest)
      }),
    [],
  )

  /** Record a completed login. Called by the Login page. */
  const signIn = useCallback((nextUser) => {
    const sessionUser = toSessionUser(nextUser)

    if (!sessionUser) return

    setUser(sessionUser)
    setIsGuest(false)
    setStatus(AUTH_STATUS.authenticated)
  }, [])

  /**
   * Replace the session user after the backend confirms a profile change.
   *
   * The stored copy is refreshed too, so the name shown in the sidebar, the
   * navbar and the mobile header all follow the edit without the page having to
   * be reloaded. Only the same three public fields are kept, so this can never
   * be used to push anything else into the session.
   */
  const updateUser = useCallback((nextUser) => {
    const sessionUser = toSessionUser(nextUser)

    if (!sessionUser) return

    updateStoredUser(sessionUser)
    setUser(sessionUser)
  }, [])

  /**
   * Log out. The token is removed from this browser only; there is no server
   * side session to end, because the backend issues stateless JWTs.
   */
  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
    setIsGuest(false)
    setStatus(AUTH_STATUS.guest)
  }, [])

  const startGuestSession = useCallback(() => {
    setIsGuest(true)
  }, [])

  // Only ends the guest session. A signed-in account is untouched, so this
  // cannot silently log someone out.
  const endGuestSession = useCallback(() => {
    setIsGuest(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isGuest,
      isAuthenticated: status === AUTH_STATUS.authenticated && Boolean(user),
      // True while GET /api/auth/me is in flight after a page load.
      isAuthenticating: status === AUTH_STATUS.restoring,
      signIn,
      updateUser,
      signOut,
      startGuestSession,
      endGuestSession,
    }),
    [user, status, isGuest, signIn, updateUser, signOut, startGuestSession, endGuestSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
