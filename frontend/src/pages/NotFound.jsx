import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-900 text-plum-300">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>

      <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-plum-700 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-sage-900">Page not found</h1>
      <p className="mt-3 max-w-md text-base text-ink-500">
        The page you are looking for does not exist or has moved.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to={ROUTES.home} className={buttonClasses({ variant: 'primary' })}>
          Back to home
        </Link>
        <Link to={ROUTES.dashboard} className={buttonClasses({ variant: 'secondary' })}>
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
