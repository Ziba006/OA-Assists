import Card from './ui/Card'

const iconTones = {
  sage: 'border border-sage-200 bg-sage-50 text-sage-600',
  plum: 'border border-plum-200 bg-plum-50 text-plum-500',
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'sage',
  className = '',
}) {
  return (
    <Card className={`flex flex-col items-center px-6 py-14 text-center ${className}`}>
      {Icon ? (
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
            iconTones[tone] ?? iconTones.sage
          }`}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      ) : null}

      <h2 className="mt-6 text-lg font-semibold text-sage-900">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  )
}
