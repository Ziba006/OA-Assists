import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import { buttonClasses } from './ui/buttonStyles'
import { HOME_SECTIONS, ROUTES } from '../routes'

const navLinks = [
  { label: 'Home', to: ROUTES.home },
  { label: 'How It Works', to: `${ROUTES.home}#${HOME_SECTIONS.howItWorks}` },
  { label: 'About', to: `${ROUTES.home}#${HOME_SECTIONS.about}` },
]

function linkClasses({ isActive }) {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-brand-50 hover:text-brand-800',
  ].join(' ')
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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <nav aria-label="Main" className="container-page flex h-16 items-center justify-between gap-4">
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

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-ink-700 transition-colors hover:bg-brand-50 md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? 'Close main menu' : 'Open main menu'}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white md:hidden"
        >
          <div className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) =>
                  `${linkClasses({ isActive })} px-3 py-3 text-base`
                }
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
