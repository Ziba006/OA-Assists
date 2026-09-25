import { Link } from 'react-router-dom'
import { LogIn, ShieldCheck } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

export default function Login() {
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-md animate-fade-up">
        <Card className="p-8 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-900 text-plum-300">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-sage-900">Login</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Account sign-in will be enabled in a later stage. Continue as a guest to explore the
            assessment flow, or return to the home page.
          </p>

          <Badge tone="neutral" className="mt-5">
            Authentication not connected
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

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
          OA Assist provides AI-assisted preliminary assessment and does not replace evaluation or
          diagnosis by a qualified healthcare professional.
        </p>
      </div>
    </div>
  )
}
