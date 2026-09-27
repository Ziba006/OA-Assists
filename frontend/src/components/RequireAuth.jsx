import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes'

/**
 * Route guard for pages that need a signed-in user.
 *
 * The stored token is not enough: `AuthContext` sets `isAuthenticated` only
 * after GET /api/auth/me confirmed it, so reaching an authenticated page always
 * means the backend accepted the token on this page load. After a logout, or
 * with an expired token, the user is sent to the login page instead.
 *
 * `allowGuest` keeps the guest experience working: a guest session may still
 * reach the app pages, because those are the same pages the guest flow uses.
 *
 * While the session is being restored nothing is rendered, so a valid token is
 * not bounced to the login page by mistake.
 */
export default function RequireAuth({ allowGuest = false, children }) {
  const { isAuthenticated, isAuthenticating, isGuest } = useAuth()
  const location = useLocation()

  if (isAuthenticating) return null

  if (isAuthenticated) return children
  if (allowGuest && isGuest) return children

  return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
}
