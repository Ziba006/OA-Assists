import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

const DEFAULT_STEPS = [
  { key: 'xray', label: 'X-Ray', icon: 'scan', to: ROUTES.xray },
  { key: 'gait', label: 'Gait', icon: 'gait', to: ROUTES.gait },
  { key: 'symptoms', label: 'Symptoms', icon: 'symptoms', to: ROUTES.symptoms },
]

/**
 * Assessment progress indicator.
 *
 * Completion is derived from real session data in AssessmentContext, so it stays
 * at 0 until a module actually produces something. No mock results.
 */
export default function ProgressPipeline({ steps = DEFAULT_STEPS, drafts = {}, className = '' }) {
  const completedCount = steps.filter((step) => Boolean(drafts?.[step.key])).length
  const currentIndex = steps.findIndex((step) => !drafts?.[step.key])

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-sage-900">Assessment Progress</h2>
          <p className="mt-1 text-sm text-ink-500">
            {completedCount} of {steps.length} assessments completed
          </p>
        </div>
        <span className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-medium text-ink-500">
          {completedCount === 0 ? 'Not started' : 'In progress'}
        </span>
      </div>

      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => {
          const isComplete = Boolean(drafts?.[step.key])
          const isCurrent = !isComplete && index === currentIndex

          return (
            <li key={step.key} className="relative">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-5 left-14 hidden h-px w-[calc(100%-3.5rem)] bg-gradient-to-r from-line-strong to-transparent sm:block"
                />
              ) : null}

              <Link
                to={step.to}
                className={`group flex items-center gap-3 rounded-xl border bg-surface-warm px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${
                  isCurrent
                    ? 'border-plum-200 hover:border-plum-400'
                    : 'border-line hover:border-sage-300'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold transition-colors duration-200 ${
                    isComplete
                      ? 'bg-sage-500 text-cream'
                      : isCurrent
                        ? 'bg-plum-50 text-plum-700'
                        : 'bg-surface-muted text-ink-400 group-hover:bg-sage-50 group-hover:text-sage-700'
                  }`}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-sage-900">{step.label}</span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      isComplete ? 'text-sage-700' : isCurrent ? 'text-plum-600' : 'text-ink-400'
                    }`}
                  >
                    {isComplete ? 'Completed' : isCurrent ? 'Next step' : 'Not completed'}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
