import { Link } from 'react-router-dom'
import { Activity, Info, Radio, Waves } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import ModuleStageList from '../components/ModuleStageList'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

const stages = [
  {
    title: 'Sensor input',
    description:
      'Pair a wearable IMU device and record a walking session. Hardware capture is part of the next stage.',
  },
  {
    title: 'Gait signal processing',
    description: 'Clean and segment accelerometer and gyroscope signals into gait cycles.',
  },
  {
    title: 'Feature extraction',
    description: 'Derive timing, symmetry and variability features from the processed signal.',
  },
  {
    title: 'AI-assisted gait analysis',
    description:
      'Features are evaluated by the gait model once the service is connected. No hardware is used today.',
  },
]

const waveform = [18, 42, 66, 38, 74, 52, 30, 58, 80, 44, 26, 62, 36, 70, 48, 24, 56, 34, 68, 40]

export default function Gait() {
  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Assessment module"
        title="Gait Assessment"
        step="Step 2 of 3"
        subtitle="Walking pattern analysis"
        status="Hardware integration planned"
        statusTone="sage"
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Radio className="h-5 w-5 text-sage-600" aria-hidden="true" />
                <h2 className="text-base font-semibold text-sage-900">Sensor input</h2>
              </div>
              <Badge tone="sage" dot>
                No sensor connected
              </Badge>
            </div>

            <div className="mt-5 flex aspect-16/9 flex-col justify-center gap-5 rounded-xl border border-sage-200 bg-sage-900 px-6">
              <div className="flex items-end gap-1.5" aria-hidden="true">
                {waveform.map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    style={{ height: `${height}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-sage-600/50 to-sage-300"
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sage-200/70">
                <span className="inline-flex items-center gap-1.5">
                  <Waves className="h-3.5 w-3.5" aria-hidden="true" />
                  Imu signal preview
                </span>
                <span>Illustrative placeholder — no live sensor data</span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              The wearable IMU module has not been built. This visual is a static placeholder and
              does not read from any device.
            </p>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-sage-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-sage-900">Gait workspace</h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {['Gait cycles', 'Symmetry', 'Variability'].map((metric) => (
                <div
                  key={metric}
                  className="rounded-xl border border-dashed border-sage-200 bg-sage-50 px-4 py-5 text-center"
                >
                  <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">
                    {metric}
                  </p>
                  <p className="mt-2 text-sm text-ink-400">Awaiting sensor input</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="h-fit p-6 sm:p-8">
          <h2 className="text-base font-semibold text-sage-900">Module status</h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Processing stages this workspace will follow once hardware and the gait model are
            connected.
          </p>

          <ModuleStageList stages={stages} className="mt-6" />

          <div className="mt-6 flex gap-3 rounded-xl border border-line bg-surface px-4 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-500">
              No hardware and no gait AI model are connected, so this page produces no results or
              scores. It is a prepared workspace for the next stage.
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
