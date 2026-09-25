import { History as HistoryIcon } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'
import { ROUTES } from '../routes'

export default function History() {
  return (
    <PagePlaceholder
      icon={HistoryIcon}
      title="Assessment History"
      description="A timeline of past assessments. History will be stored for signed-in accounts, while guest sessions remain temporary and are cleared when the session ends."
      status="Database planned"
      statusTone="neutral"
      nextSteps={[
        'History list with per-assessment detail view',
        'History stored against a signed-in account only',
        'Guest session data discarded when the session ends',
      ]}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    />
  )
}
