import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

export default function Signup() {
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-md animate-fade-up">
        <Card className="p-8 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-900 text-plum-300">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-sage-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Registration is planned for a later stage. Creating an account will let you save
            assessment history; for now, you can explore the prototype as a guest.
          </p>

          <Badge tone="neutral" className="mt-5">
            Registration not connected
          </Badge>

          <div className="mt-8 space-y-3">
            <Link
              to={ROUTES.guest}
              className={buttonClasses({ variant: 'primary', className: 'w-full' })}
            >
              Continue as Guest
            </Link>
            <Link
              to={ROUTES.home}
              className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
            >
              Back to home
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
