import { UserRound } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'
import { ROUTES } from '../routes'

export default function Profile() {
  return (
    <PagePlaceholder
      icon={UserRound}
      title="Profile"
      description="Your personal details and preferences will be managed here once accounts are connected to the backend."
      status="Authentication planned"
      statusTone="neutral"
      nextSteps={[
        'Account details and contact information',
        'Consent and data management preferences',
        'Profile linked to saved assessment history',
      ]}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    />
  )
}
