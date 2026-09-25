import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import Badge from './ui/Badge'
import { buttonClasses } from './ui/buttonStyles'
import { ROUTES } from '../routes'

export default function PagePlaceholder({
  icon: Icon = Construction,
  title,
  description,
  status = 'Planned',
  statusTone = 'neutral',
  nextSteps = [],
  backTo = ROUTES.home,
  backLabel = 'Back to home',
}) {
  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card sm:p-10">
        {Icon ? (
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        ) : null}

        <Badge tone={statusTone} className="mt-5">
          {status}
        </Badge>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-3 text-base leading-relaxed text-pretty text-ink-500">{description}</p>

        {nextSteps.length > 0 ? (
          <ul className="mt-8 space-y-2 text-left text-sm text-ink-500">
            {nextSteps.map((step) => (
              <li
                key={step}
                className="flex gap-3 rounded-xl border border-slate-200 bg-surface px-4 py-3"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                {step}
              </li>
            ))}
          </ul>
        ) : null}

        <Link
          to={backTo}
          className={buttonClasses({ variant: 'secondary', className: 'mt-8' })}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
