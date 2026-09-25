import { Check, Clock } from 'lucide-react'

const statusStyles = {
  pending: {
    icon: Clock,
    chip: 'border-sage-200 bg-sage-50 text-sage-700',
    dot: 'bg-sage-300',
  },
  ready: {
    icon: Check,
    chip: 'border-plum-200 bg-plum-50 text-plum-700',
    dot: 'bg-plum-500',
  },
}

/**
 * Visual placeholder list describing the stages a module will go through.
 * Statuses are static UI copy — no assessment data is produced here.
 */
export default function ModuleStageList({ stages, className = '' }) {
  return (
    <ol className={`space-y-3 ${className}`}>
      {stages.map(({ title, description, status = 'pending' }, index) => {
        const { icon: Icon, chip, dot } = statusStyles[status] ?? statusStyles.pending

        return (
          <li
            key={title}
            className="flex gap-4 rounded-xl border border-line bg-surface-warm px-4 py-4 transition-colors duration-200 hover:border-sage-300"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted text-xs font-semibold text-ink-500"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-sage-900">{title}</h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.68rem] font-medium ${chip}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
                  {status === 'ready' ? 'Available' : 'Planned'}
                </span>
              </div>
              {description ? (
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>
              ) : null}
            </div>

            <Icon className="mt-1 h-4 w-4 shrink-0 text-sage-300" aria-hidden="true" />
          </li>
        )
      })}
    </ol>
  )
}
