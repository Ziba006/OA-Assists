import { Footprints } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'
import { ROUTES } from '../routes'

export default function Gait() {
  return (
    <PagePlaceholder
      icon={Footprints}
      title="Gait Assessment"
      description="Assess walking patterns from wearable sensor data. The hardware and IMU capture module is part of the planned next stage, so no sensor is required in this prototype."
      status="Hardware module planned"
      statusTone="warning"
      nextSteps={[
        'Sensor pairing and session capture',
        'Gait signal preprocessing and feature extraction',
        'AI-assisted gait analysis and observations',
      ]}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    />
  )
}
