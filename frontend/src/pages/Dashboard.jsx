import { Link } from 'react-router-dom'
import { ClipboardList, FileText, Footprints, LayoutDashboard, ScanLine } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes'

const modules = [
  {
    icon: ScanLine,
    title: 'X-Ray Assessment',
    description: 'AI-assisted imaging module entry point.',
    to: ROUTES.xray,
  },
  {
    icon: Footprints,
    title: 'Gait Assessment',
    description: 'Walking-pattern assessment entry point.',
    to: ROUTES.gait,
  },
  {
    icon: ClipboardList,
    title: 'Symptom Assessment',
    description: 'Guided questionnaire entry point.',
    to: ROUTES.symptoms,
  },
]

export default function Dashboard() {
  const { isGuest } = useAuth()

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Choose an assessment module to begin. Modules will be connected to the AI services in
            a later stage.
          </p>
        </div>
        {isGuest ? <Badge tone="warning">Guest session</Badge> : <Badge tone="brand">Prototype</Badge>}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {modules.map(({ icon: Icon, title, description, to }) => (
          <Card key={to} className="flex flex-col p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-ink-900">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{description}</p>
            <Link
              to={to}
              className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'mt-6 w-full' })}
            >
              Open module
            </Link>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-ink-900">
            <FileText className="h-5 w-5 text-brand-700" aria-hidden="true" />
            <h2 className="text-base font-semibold">Reports</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Combined preliminary assessments will appear here once analysis modules are connected.
          </p>
          <Link
            to={ROUTES.reports}
            className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'mt-4 -ml-3' })}
          >
            View reports
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-ink-900">
            <LayoutDashboard className="h-5 w-5 text-brand-700" aria-hidden="true" />
            <h2 className="text-base font-semibold">Assessment history</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            History becomes available for signed-in accounts. Guest sessions are temporary.
          </p>
          <Link
            to={ROUTES.history}
            className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'mt-4 -ml-3' })}
          >
            View history
          </Link>
        </Card>
      </div>
    </div>
  )
}
