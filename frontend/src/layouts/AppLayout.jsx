import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import AppSidebar from '../components/AppSidebar'

const MOBILE_BREAKPOINT = '(min-width: 768px)'

function matchesDesktop() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia(MOBILE_BREAKPOINT).matches
}

export default function AppLayout() {
  const location = useLocation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [routePath, setRoutePath] = useState(location.pathname)
  const [isDesktop, setIsDesktop] = useState(matchesDesktop)

  // Close the drawer on navigation (render-time state reset).
  if (routePath !== location.pathname) {
    setRoutePath(location.pathname)
    setIsDrawerOpen(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT)
    const handleChange = (event) => setIsDesktop(event.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isDrawerOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsDrawerOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  return (
    <div className="min-h-screen bg-surface md:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-sage-800 bg-sage-900 px-4 md:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cream/15 text-plum-100 transition-colors hover:bg-cream/10"
          aria-expanded={isDrawerOpen}
          aria-controls="app-sidebar"
          aria-label="Open navigation menu"
          onClick={() => setIsDrawerOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <p className="text-sm font-semibold text-cream">OA Assist</p>

        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      {/* Desktop sidebar */}
      <aside
        id="app-sidebar"
        aria-label="Sidebar"
        className="sticky top-0 hidden h-screen w-[220px] shrink-0 self-start md:block lg:w-[250px]"
      >
        <AppSidebar />
      </aside>

      {/* Mobile drawer */}
      {isDrawerOpen && !isDesktop ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-sage-900/60 backdrop-blur-sm"
            aria-label="Close navigation menu"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside
            className="animate-slide-in absolute inset-y-0 left-0 w-[270px] max-w-[85vw] shadow-soft"
            aria-label="Sidebar"
          >
            <button
              type="button"
              className="absolute top-5 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cream/15 text-plum-100 transition-colors hover:bg-cream/10"
              aria-label="Close navigation menu"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <AppSidebar onNavigate={() => setIsDrawerOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <main id="main-content" className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
