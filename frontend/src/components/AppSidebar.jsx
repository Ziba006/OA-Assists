import { NavLink, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  FileText,
  Footprints,
  History as HistoryIcon,
  Home,
  LayoutDashboard,
  ScanLine,
  Settings as SettingsIcon,
  UserRound,
} from 'lucide-react'
import Logo from './Logo'
import Badge from './ui/Badge'
import { buttonClasses } from './ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes'

const navGroups = [
  {
    label: 'General',
    items: [
      { label: 'Home', to: ROUTES.home, icon: Home },
      { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Assessment',
    items: [
      { label: 'X-Ray', to: ROUTES.xray, icon: ScanLine },
      { label: 'Gait', to: ROUTES.gait, icon: Footprints },
      { label: 'Symptoms', to: ROUTES.symptoms, icon: ClipboardList },
    ],
  },
  {
    label: 'Activity',
    items: [
      { label: 'Reports', to: ROUTES.reports, icon: FileText },
      { label: 'History', to: ROUTES.history, icon: HistoryIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: ROUTES.profile, icon: UserRound },
      { label: 'Settings', to: ROUTES.settings, icon: SettingsIcon },
    ],
  },
]

function itemClasses({ isActive }) {
  return [
    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-sage-600 text-cream'
      : 'text-sage-300 hover:bg-cream/5 hover:text-cream',
  ].join(' ')
}

function NavGroup({ label, items, onNavigate, separated }) {
  return (
    <div className={separated ? 'border-t border-cream/10 pt-5' : undefined}>
      <p className="px-3 text-[0.65rem] font-semibold tracking-[0.16em] text-sage-300/70 uppercase">
        {label}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map(({ label: itemLabel, to, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} onClick={onNavigate} className={itemClasses}>
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full bg-plum-300"
                    />
                  ) : null}
                  <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  {itemLabel}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AppSidebar({ onNavigate }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAuthenticating, signOut } = useAuth()

  const handleSignOut = () => {
    // Removes the stored JWT and returns the app to the guest state.
    signOut()
    onNavigate?.()
    navigate(ROUTES.login)
  }

  return (
    <div className="flex h-full flex-col bg-sage-900">
      <div className="px-5 py-5">
        <Logo variant="onDark" onClick={onNavigate} />
      </div>

      <nav aria-label="Application" className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {navGroups.map((group, index) => (
          <NavGroup key={group.label} {...group} onNavigate={onNavigate} separated={index > 0} />
        ))}
      </nav>

      <div className="border-t border-cream/10 px-4 py-4">
        <div className="rounded-xl border border-cream/10 bg-cream/5 p-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-sage-400" aria-hidden="true" />
                <p className="truncate text-sm font-semibold text-cream">
                  {user.fullName || user.email}
                </p>
              </div>

              <p className="mt-1 truncate text-xs text-sage-300/80">{user.email}</p>

              <p className="mt-1 text-xs leading-relaxed text-sage-300/80">
                Signed in. Assessments are linked to this account.
              </p>

              <button
                type="button"
                onClick={handleSignOut}
                className={buttonClasses({
                  variant: 'primary',
                  size: 'sm',
                  className: 'mt-3 w-full',
                })}
              >
                Logout
              </button>
            </>
          ) : isAuthenticating ? (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-plum-300" aria-hidden="true" />
                <p className="text-sm font-semibold text-cream">Checking session</p>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-sage-300/80">
                Confirming your saved sign-in.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-plum-300" aria-hidden="true" />
                <p className="text-sm font-semibold text-cream">No account connected</p>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-sage-300/80">
                Account features are not connected in this prototype.
              </p>

              <NavLink
                to={ROUTES.signup}
                onClick={onNavigate}
                className={buttonClasses({
                  variant: 'primary',
                  size: 'sm',
                  className: 'mt-3 w-full',
                })}
              >
                Create Account
              </NavLink>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Badge tone="dark" dot>
            Software Prototype
          </Badge>
        </div>
      </div>
    </div>
  )
}
