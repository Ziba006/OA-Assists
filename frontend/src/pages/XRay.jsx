import { Info, ScanLine, UploadCloud } from 'lucide-react'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import ModuleStageList from '../components/ModuleStageList'
import { buttonClasses } from '../components/ui/buttonStyles'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'

const stages = [
  {
    title: 'Image upload',
    description: 'Select a knee X-ray image (DICOM or common image formats) to begin.',
  },
  {
    title: 'Image preview',
    description: 'Review the selected image and confirm the correct joint and view.',
  },
  {
    title: 'Basic validation',
    description: 'File checks for format, size and image quality before any request is sent.',
  },
  {
    title: 'AI-assisted imaging analysis',
    description: 'Analysis is performed by the imaging model once the service is connected.',
  },
  {
    title: 'Structured observations',
    description: 'Observations are displayed alongside the original image, clearly marked as preliminary.',
  },
]

export default function XRay() {
  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Assessment module"
        title="X-Ray Assessment"
        step="Step 1 of 3"
        subtitle="Upload your knee X-ray"
        status="Prototype"
        statusTone="brand"
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <div
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sage-300 bg-surface-warm px-6 py-16 text-center transition-colors duration-200 hover:border-plum-300 hover:bg-plum-50/40"
              aria-hidden="true"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-plum-600">
                <UploadCloud className="h-7 w-7" />
              </span>
              <h2 className="mt-5 text-base font-semibold text-sage-900">
                Drag and drop your X-ray image here
              </h2>
              <p className="mt-2 max-w-sm text-sm text-ink-500">
                Uploading is not enabled in this prototype. The workspace is prepared for the
                imaging service.
              </p>
              <span
                className={`mt-6 ${buttonClasses({ variant: 'primary', className: 'pointer-events-none opacity-70' })}`}
              >
                Choose file
              </span>
              <p className="mt-4 text-xs text-ink-400">PNG, JPG or DICOM &bull; up to 20 MB</p>
            </div>

            <p className="mt-4 text-xs text-ink-400">
              Image upload is disabled until the imaging API is connected. No data leaves your
              browser in this version.
            </p>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-sage-900">Image preview</h2>
              <span className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-medium text-ink-500">
                Nothing uploaded
              </span>
            </div>

            <div className="mt-5 flex aspect-16/9 items-center justify-center rounded-xl border border-dashed border-sage-300 bg-sage-900 text-center">
              <div className="px-6">
                <ScanLine className="mx-auto h-8 w-8 text-sage-300" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-cream">Preview area</p>
                <p className="mt-1 text-xs text-sage-300/80">
                  The selected X-ray will be displayed here.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="h-fit p-6 sm:p-8">
          <h2 className="text-base font-semibold text-sage-900">Module status</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Stages this workspace will follow once the imaging service is connected.
          </p>

          <ModuleStageList stages={stages} className="mt-6" />

          <div className="mt-6 flex gap-3 rounded-xl border border-line bg-surface px-4 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-500">
              No AI analysis is connected yet, so this page does not produce results, scores or
              findings. It is a prepared workspace for the upcoming imaging integration.
            </p>
          </div>

          <Link
            to={ROUTES.dashboard}
            className={buttonClasses({ variant: 'secondary', className: 'mt-6 w-full' })}
          >
            Back to Dashboard
          </Link>
        </Card>
      </div>
    </div>
  )
}
