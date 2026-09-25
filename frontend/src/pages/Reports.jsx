import { FileText } from 'lucide-react'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/EmptyState'
import ModuleStageList from '../components/ModuleStageList'
import { ROUTES } from '../routes'

const stages = [
  {
    title: 'Combined report',
    description: 'X-Ray, gait and symptom signals summarised in a single report.',
  },
  {
    title: 'Observations and limitations',
    description: 'Clear separation between generated observations and stated limitations.',
  },
  {
    title: 'Sharing options',
    description: 'Export or print the report to discuss with a healthcare professional.',
  },
]

export default function Reports() {
  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Output"
        title="Reports"
        subtitle="Review combined preliminary assessments generated from the available modules."
        status="Reporting planned"
        statusTone="neutral"
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <EmptyState
          icon={FileText}
          tone="plum"
          title="No reports yet"
          description="Combined preliminary assessments will appear here once the analysis modules are connected."
        />

        <Card className="h-fit p-6 sm:p-8">
          <h2 className="text-base font-semibold text-sage-900">What a report will include</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Planned report structure for a later stage.
          </p>
          <ModuleStageList stages={stages} className="mt-6" />
        </Card>
      </div>
    </div>
  )
}
