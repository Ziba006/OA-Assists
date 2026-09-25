import { ScanLine } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'
import { ROUTES } from '../routes'

export default function XRay() {
  return (
    <PagePlaceholder
      icon={ScanLine}
      title="X-Ray Assessment"
      description="Upload and review medical images through the AI-assisted imaging module. The placeholder is ready for the imaging API integration."
      status="API integration planned"
      statusTone="accent"
      nextSteps={[
        'Image upload and preview with basic validation',
        'AI-assisted imaging analysis request',
        'Structured observations shown alongside the original image',
      ]}
      backTo={ROUTES.dashboard}
      backLabel="Back to dashboard"
    />
  )
}
