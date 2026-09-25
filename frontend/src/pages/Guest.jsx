import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Timer, Trash2 } from 'lucide-react'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes'

export default function Guest() {
  const navigate = useNavigate()
  const { isGuest, startGuestSession, endGuestSession } = useAuth()

  const handleStart = () => {
    startGuestSession()
    navigate(ROUTES.dashboard)
  }

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
          <Timer className="h-3.5 w-3.5" aria-hidden="true" />
          Temporary session
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Guest mode
        </h1>

        <p className="mt-3 text-base leading-relaxed text-ink-500">
          Explore the assessment experience without creating an account. Guest session data stays
          in your browser session only and is cleared when the session ends.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleStart}
            className={buttonClasses({ variant: 'primary', className: 'w-full' })}
          >
            {isGuest ? 'Continue to dashboard' : 'Start guest session'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>

          {isGuest ? (
            <button
              type="button"
              onClick={endGuestSession}
              className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              End guest session and clear data
            </button>
          ) : null}

          <Link
            to={ROUTES.signup}
            className={buttonClasses({ variant: 'ghost', className: 'w-full' })}
          >
            Create an account to save history
          </Link>
        </div>
      </div>
    </div>
  )
}
