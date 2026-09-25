import { Settings as SettingsIcon } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'
import { ROUTES } from '../routes'

export default function Settings() {
  return (
    <PagePlaceholder
      icon={SettingsIcon}
      title="Settings"
      description="Application settings such as session behaviour, accessibility preferences and notification choices will live here."
      status="Planned"
      statusTone="neutral"
      nextSteps={[
        'Session and guest-mode preferences',
        'Accessibility and display options',
        'Data and privacy controls',
      ]}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    />
  )
}
