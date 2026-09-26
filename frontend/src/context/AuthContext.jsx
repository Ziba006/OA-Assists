import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { clearSession, getStoredUser, onUnauthorized } from '../services/tokenStorage'

/**
 * Session state for OA Assist.
 *
 * A signed-in user is hydrated from localStorage on load, so a page refresh
 * keeps the session. The JWT itself lives in `services/tokenStorage.js`; this
 * provider only mirrors the public user fields into React state.
 *
 * Guest mode is unchanged and independent: it never writes anything to storage.
 */
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [isGuest, setIsGuest] = useState(false)

  // The backend rejected the stored token (expired or revoked), so drop the
  // session. Routing to the login page on top of this is a later step.
  useEffect(
    () =>
      onUnauthorized(() => {
        clearSession()
        setUser(null)
      }),
    [],
  )

  /** Record a completed login. Called by the Login page. */
  const signIn = useCallback((nextUser) => {
    if (!nextUser?.id) return

    setUser({ id: nextUser.id, fullName: nextUser.fullName ?? '', email: nextUser.email })
    setIsGuest(false)
  }, [])

  const startGuestSession = useCallback(() => {
    setUser(null)
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
      isGuest,
      isAuthenticated: Boolean(user),
      signIn,
      startGuestSession,
      endGuestSession,
    }),
    [user, isGuest, signIn, startGuestSession, endGuestSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
