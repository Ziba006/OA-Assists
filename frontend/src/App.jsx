import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Guest from './pages/Guest'
import Dashboard from './pages/Dashboard'
import XRay from './pages/XRay'
import Gait from './pages/Gait'
import Symptoms from './pages/Symptoms'
import Reports from './pages/Reports'
import History from './pages/History'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import { appRoutes, ROUTES } from './routes'

// One element per application route, so the routes can be generated from the
// same list the layout and the sidebar use.
const appPageElements = {
  [ROUTES.dashboard]: <Dashboard />,
  [ROUTES.xray]: <XRay />,
  [ROUTES.gait]: <Gait />,
  [ROUTES.symptoms]: <Symptoms />,
  [ROUTES.reports]: <Reports />,
  [ROUTES.history]: <History />,
  [ROUTES.profile]: <Profile />,
  [ROUTES.settings]: <Settings />,
}

function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.login} element={<Login />} />
          <Route path={ROUTES.signup} element={<Signup />} />
          <Route path={ROUTES.guest} element={<Guest />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AppLayout />}>
          {appRoutes.map((path) => (
            <Route
              key={path}
              path={path}
              element={
                // Guests may reach these pages, but a signed-out visitor who is
                // not in a guest session is sent to the login page.
                <RequireAuth allowGuest>
                  {appPageElements[path]}
                </RequireAuth>
              }
            />
          ))}
        </Route>
      </Routes>
    </>
  )
}
