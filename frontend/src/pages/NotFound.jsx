import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold tracking-[0.18em] text-brand-700 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">Page not found</h1>
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
