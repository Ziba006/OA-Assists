import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
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
import { ROUTES } from './routes'

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
          <Route path={ROUTES.dashboard} element={<Dashboard />} />
          <Route path={ROUTES.xray} element={<XRay />} />
          <Route path={ROUTES.gait} element={<Gait />} />
          <Route path={ROUTES.symptoms} element={<Symptoms />} />
          <Route path={ROUTES.reports} element={<Reports />} />
          <Route path={ROUTES.history} element={<History />} />
          <Route path={ROUTES.profile} element={<Profile />} />
          <Route path={ROUTES.settings} element={<Settings />} />
        </Route>
      </Routes>
    </>
  )
}
