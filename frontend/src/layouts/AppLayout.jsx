import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, FileText, Footprints, History, ScanLine, Settings, UserRound } from 'lucide-react'
import Logo from '../components/Logo'
import { ROUTES } from '../routes'

const appLinks = [
  { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'X-Ray', to: ROUTES.xray, icon: ScanLine },
  { label: 'Gait', to: ROUTES.gait, icon: Footprints },
  { label: 'Symptoms', to: ROUTES.symptoms, icon: ClipboardList },
  { label: 'Reports', to: ROUTES.reports, icon: FileText },
  { label: 'History', to: ROUTES.history, icon: History },
  { label: 'Profile', to: ROUTES.profile, icon: UserRound },
  { label: 'Settings', to: ROUTES.settings, icon: Settings },
]

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Software prototype
          </span>
        </div>
        <nav aria-label="Application" className="border-t border-slate-200 bg-white">
          <ul className="container-page flex gap-1 overflow-x-auto py-2">
            {appLinks.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    [
                      'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-ink-500 hover:bg-brand-50 hover:text-brand-800',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
