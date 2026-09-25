import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Badge from './Badge'
import { buttonClasses } from './buttonStyles'

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  step,
  status,
  statusTone = 'brand',
  backTo,
  backLabel = 'Back to Dashboard',
  actions,
  className = '',
}) {
  return (
    <div className={`animate-fade-up ${className}`}>
      {backTo ? (
        <Link
          to={backTo}
          className={buttonClasses({ variant: 'ghost', size: 'sm', className: '-ml-3 mb-4' })}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.18em] text-plum-700 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-sage-900 sm:text-3xl">
              {title}
            </h1>
            {step ? (
              <span className="rounded-full border border-line-strong bg-surface-warm px-3 py-1 text-xs font-medium text-ink-500">
                {step}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {status ? (
            <Badge tone={statusTone} dot>
              {status}
            </Badge>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  )
}
