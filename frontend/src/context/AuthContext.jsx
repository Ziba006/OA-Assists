import { createContext, useCallback, useMemo, useState } from 'react'

/**
 * In-memory session state only.
 *
 * No persistence is used on purpose: guest medical data must never be stored
 * permanently, and authentication is not connected yet. Once a backend exists,
 * this provider is the single place to hydrate the session from the API.
 */
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)

  const startGuestSession = useCallback(() => {
    setUser(null)
    setIsGuest(true)
  }, [])

  const endGuestSession = useCallback(() => {
    setUser(null)
    setIsGuest(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isGuest,
      isAuthenticated: Boolean(user),
      startGuestSession,
      endGuestSession,
    }),
    [user, isGuest, startGuestSession, endGuestSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
