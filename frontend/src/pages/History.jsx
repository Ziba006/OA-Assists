import { History as HistoryIcon } from 'lucide-react'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/EmptyState'
import ModuleStageList from '../components/ModuleStageList'
import Badge from '../components/ui/Badge'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes'

const stages = [
  {
    title: 'Assessment timeline',
    description: 'A chronological list of assessments with their date and modules used.',
  },
  {
    title: 'Stored for accounts only',
    description: 'History is linked to a signed-in account once authentication exists.',
  },
  {
    title: 'Guest sessions stay temporary',
    description: 'Guest data is held in the current session and discarded when it ends.',
  },
]

export default function History() {
  const { isGuest } = useAuth()

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Records"
        title="Assessment History"
        subtitle="Review previous assessments and the modules used."
        status={isGuest ? 'Guest session' : 'Database planned'}
        statusTone={isGuest ? 'sage' : 'neutral'}
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <EmptyState
            icon={HistoryIcon}
            title="No assessment history yet"
            description="Assessment history will be available for signed-in accounts."
          />
          {isGuest ? (
            <Card className="mt-4 border-amber-200 bg-amber-50/70 p-5">
              <p className="text-sm leading-relaxed text-sage-800">
                Guest assessments are temporary and are not saved to an account. Create an account
                later to keep assessment history.
              </p>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-sage-900">Planned behaviour</h2>
            <Badge tone="neutral">Later stage</Badge>
          </div>
          <ModuleStageList stages={stages} className="mt-6" />
        </Card>
      </div>
    </div>
  )
}
