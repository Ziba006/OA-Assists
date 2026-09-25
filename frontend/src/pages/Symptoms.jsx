import { ClipboardList } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'
import { ROUTES } from '../routes'

export default function Symptoms() {
  return (
    <PagePlaceholder
      icon={ClipboardList}
      title="Symptom Assessment"
      description="A guided questionnaire that captures joint pain, stiffness and function context to support a preliminary assessment."
      status="Questionnaire planned"
      statusTone="brand"
      nextSteps={[
        'Multi-step question flow with validation',
        'Session answers held in temporary assessment state',
        'Symptom summary included in the combined report',
      ]}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    />
  )
}
