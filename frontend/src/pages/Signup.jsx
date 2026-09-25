import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

export default function Signup() {
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Registration is planned for a later stage. Creating an account will let you save
          assessment history; for now, you can explore the prototype as a guest.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to={ROUTES.guest}
            className={buttonClasses({ variant: 'primary', className: 'w-full' })}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
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
