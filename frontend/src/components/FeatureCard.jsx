import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Card from './ui/Card'
import { buttonClasses } from './ui/buttonStyles'
import Badge from './ui/Badge'

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  badge,
  note,
}) {
  return (
    <Card className="flex h-full flex-col p-6 transition-shadow duration-200 hover:shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{description}</p>

      {badge ? (
        <Badge tone="warning" className="mt-4 self-start">
          {badge}
        </Badge>
      ) : null}

      {note ? <p className="mt-3 text-xs leading-relaxed text-ink-500">{note}</p> : null}

      {actionTo ? (
        <Link
          to={actionTo}
          className={buttonClasses({
            variant: 'secondary',
            size: 'sm',
            className: 'mt-6 w-full',
          })}
        >
          {actionLabel}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </Card>
  )
}
