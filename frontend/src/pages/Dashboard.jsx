import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FileText,
  History,
  Layers,
  ScanLine,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import ProgressPipeline from '../components/ProgressPipeline'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { useAssessment } from '../hooks/useAssessment'
import { ROUTES } from '../routes'

const modules = [
  {
    key: 'xray',
    icon: ScanLine,
    iconTone: 'border border-sage-200 bg-sage-50 text-sage-700',
    category: 'Medical imaging',
    title: 'X-Ray Assessment',
    description: 'Upload a knee X-ray for AI-assisted preliminary assessment.',
    status: 'Prototype',
    statusTone: 'brand',
    cta: 'Start Analysis',
    to: ROUTES.xray,
  },
  {
    key: 'gait',
    icon: Activity,
    iconTone: 'border border-sage-200 bg-sage-100 text-sage-800',
    category: 'Walking pattern analysis',
    title: 'Gait Assessment',
    description: 'Analyze gait patterns using wearable sensor data.',
    status: 'Integration planned',
    statusTone: 'sage',
    cta: 'Start Analysis',
    to: ROUTES.gait,
  },
  {
    key: 'symptoms',
    icon: ClipboardList,
    iconTone: 'border border-plum-200 bg-plum-50 text-plum-600',
    category: 'Guided questionnaire',
    title: 'Symptom Assessment',
    description: 'Answer questions about pain, stiffness and mobility.',
    status: 'Coming next',
    statusTone: 'neutral',
    cta: 'Start Assessment',
    to: ROUTES.symptoms,
  },
]

const overallSignals = [
  { key: 'xray', label: 'X-Ray', icon: ScanLine },
  { key: 'gait', label: 'Gait', icon: Activity },
  { key: 'symptoms', label: 'Symptoms', icon: ClipboardList },
]

function ModuleCard({ module }) {
  const Icon = module.icon

  return (
    <Card interactive className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${module.iconTone}`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <Badge tone={module.statusTone} dot>
          {module.status}
        </Badge>
      </div>

      <p className="mt-5 text-xs font-semibold tracking-[0.16em] text-plum-700 uppercase">
        {module.category}
      </p>
      <h2 className="mt-1.5 text-lg font-semibold text-sage-900">{module.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{module.description}</p>

      <Link
        to={module.to}
        className={buttonClasses({
          variant: 'primary',
          size: 'md',
          className: 'group mt-6 w-full',
        })}
      >
        {module.cta}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </Card>
  )
}

export default function Dashboard() {
  const { isGuest } = useAuth()
  const { drafts } = useAssessment()
  const completedCount = modules.filter((module) => Boolean(drafts?.[module.key])).length

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        title="Dashboard"
        subtitle="Choose an assessment module to begin."
        status={isGuest ? 'Guest session' : 'Software prototype'}
        statusTone={isGuest ? 'sage' : 'brand'}
      />

      <Card className="mt-8 p-6 sm:p-8">
        <ProgressPipeline drafts={drafts} />
      </Card>

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2 id="modules-heading" className="text-base font-semibold text-sage-900">
          Assessment modules
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.key} module={module} />
          ))}
        </div>
      </section>

      <Card className="mt-10 overflow-hidden">
        <div className="border-b border-line px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-plum-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-sage-900">Overall Assessment</h2>
            </div>
            <Badge tone="neutral">Report generation planned</Badge>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-lg font-semibold text-sage-900">
              {completedCount === 0 ? 'No assessment completed yet' : 'Assessments in progress'}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              Complete the X-Ray, Gait and Symptom assessments to generate a combined preliminary
              assessment.
            </p>

            <button
              type="button"
              disabled
              className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}
            >
              View Combined Report
            </button>
            <p className="mt-2 text-xs text-ink-400">
              Available once the assessment modules are connected.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {overallSignals.map(({ key, label, icon: Icon }) => {
              const isComplete = Boolean(drafts?.[key])

              return (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-sage-200 bg-sage-50/60 px-4 py-3"
                >
                  <Icon className="h-4 w-4 text-sage-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-ink-700">{label}</span>
                  <span className="ml-auto text-xs text-ink-400">
                    {isComplete ? 'Provided' : 'Awaiting input'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </Card>

      <section aria-labelledby="recent-activity-heading" className="mt-10">
        <h2 id="recent-activity-heading" className="text-base font-semibold text-sage-900">
          Recent Activity
        </h2>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <Card interactive className="flex flex-col p-6">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-sage-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-sage-900">Reports</h3>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">
              Combined preliminary assessments will appear here once the analysis modules are
              connected.
            </p>
            <Link
              to={ROUTES.reports}
              className={buttonClasses({
                variant: 'ghost',
                size: 'sm',
                className: 'mt-4 -ml-3 self-start',
              })}
            >
              View Reports
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>

          <Card interactive className="flex flex-col p-6">
            <div className="flex items-center gap-2.5">
              <History className="h-5 w-5 text-sage-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-sage-900">Assessment History</h3>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">
              Assessment history will be available for signed-in accounts.
            </p>
            {isGuest ? (
              <p className="mt-2 text-xs text-warning-700">
                Guest assessments are temporary and are not saved to an account.
              </p>
            ) : null}
            <Link
              to={ROUTES.history}
              className={buttonClasses({
                variant: 'ghost',
                size: 'sm',
                className: 'mt-4 -ml-3 self-start',
              })}
            >
              View History
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </section>
    </div>
  )
}
