import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Timer, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
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
      <div className="mx-auto max-w-xl animate-fade-up">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-8 py-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-plum-200 bg-plum-50 px-3 py-1 text-xs font-medium text-plum-700">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              Temporary session
            </span>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-sage-900 sm:text-3xl">
              Guest mode
            </h1>

            <p className="mt-3 text-base leading-relaxed text-ink-500">
              Explore the assessment experience without creating an account. Guest session data
              stays in your browser session only and is cleared when the session ends.
            </p>

            {isGuest ? (
              <Badge tone="warning" dot className="mt-5">
                Guest session active
              </Badge>
            ) : null}
          </div>

          <div className="space-y-3 px-8 py-7">
            <button
              type="button"
              onClick={handleStart}
              className={buttonClasses({ variant: 'primary', className: 'group w-full' })}
            >
              {isGuest ? 'Continue to dashboard' : 'Start guest session'}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
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
        </Card>
      </div>
    </div>
  )
}
