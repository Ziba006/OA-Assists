import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

export default function Login() {
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Login</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Account sign-in will be enabled in a later stage. Continue as a guest to explore the
          assessment flow, or return to the home page.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to={ROUTES.guest}
            className={buttonClasses({ variant: 'primary', className: 'w-full' })}
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Continue as Guest
          </Link>
          <Link
            to={ROUTES.home}
            className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
