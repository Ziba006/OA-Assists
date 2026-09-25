import { FileText } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'
import { ROUTES } from '../routes'

export default function Reports() {
  return (
    <PagePlaceholder
      icon={FileText}
      title="Reports"
      description="Combined preliminary assessments, merging the available imaging, gait and symptom signals into a single report for review."
      status="Reporting planned"
      statusTone="neutral"
      nextSteps={[
        'Combined report generated from available modules',
        'Clear separation of observations and limitations',
        'Export options for sharing with a healthcare professional',
      ]}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    />
  )
}
