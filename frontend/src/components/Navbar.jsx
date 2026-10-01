import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'
import Logo from './Logo'
import { buttonClasses } from './ui/buttonStyles'
import { HOME_SECTIONS, ROUTES } from '../routes'
import useTheme from '../hooks/useTheme'

const navLinks = [
  { label: 'Home', to: ROUTES.home },
  { label: 'How It Works', to: `${ROUTES.home}#${HOME_SECTIONS.howItWorks}` },
  { label: 'About', to: `${ROUTES.home}#${HOME_SECTIONS.about}` },
]

function linkClasses({ isActive }) {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'bg-plum-50 text-plum-700 ring-1 ring-plum-200'
      : 'text-ink-700 hover:bg-sage-50 hover:text-sage-800',
  ].join(' ')
}

/**
 * The appearance switch, shown on the public header.
 *
 * It is the same control the Settings page uses: `useTheme` is the only place
 * theme state lives, so this neither duplicates that logic nor disagrees with it.
 * A visitor who switches theme here arrives at the signed-in app already in the
 * theme they chose, because the choice is stored under one shared key.
 */
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  const action = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={action}
      title={action}
      className={[
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500',
        isDark
          ? 'border-plum-300 bg-plum-50 text-plum-700 ring-1 ring-plum-200'
          : 'border-line-strong bg-surface-warm text-ink-700 hover:border-plum-300 hover:bg-plum-50 hover:text-sage-800',
      ].join(' ')}
    >
      {/* Shows the theme the click switches to, not the one currently on. */}
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}

export default function Navbar() {
  const location = useLocation()
  const currentLocation = `${location.pathname}${location.hash}`
  const [isOpen, setIsOpen] = useState(false)
  const [menuLocation, setMenuLocation] = useState(currentLocation)

  // Close the mobile menu whenever navigation happens (render-time state reset).
  if (menuLocation !== currentLocation) {
    setMenuLocation(currentLocation)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    // `bg-surface` rather than `bg-cream`: the two are the same cream in the
    // light theme, so this looks unchanged there, but `surface` follows the
    // theme, so the header does not stay a pale bar once dark mode is on.
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <nav aria-label="Main" className="container-page flex h-18 items-center justify-between gap-4">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.label} to={link.to} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to={ROUTES.login}
            className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'px-4' })}
          >
            Login
          </Link>
          <Link
            to={ROUTES.signup}
            className={buttonClasses({ variant: 'primary', size: 'sm', className: 'px-4' })}
          >
            Get Started
          </Link>
        </div>

        {/*
          One instance of the switch for every viewport, so it stays reachable
          without opening the mobile menu. It sits last in the bar on desktop,
          beside the login controls, and takes the hamburger's place on mobile.
        */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong text-ink-700 transition-colors hover:border-plum-300 hover:bg-plum-50 hover:text-sage-800 md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? 'Close main menu' : 'Open main menu'}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen ? (
        <div id="mobile-navigation" className="border-t border-line bg-surface-warm md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) => `${linkClasses({ isActive })} px-3 py-3 text-base`}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                to={ROUTES.login}
                className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
              >
                Login
              </Link>
              <Link
                to={ROUTES.signup}
                className={buttonClasses({ variant: 'primary', className: 'w-full' })}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
