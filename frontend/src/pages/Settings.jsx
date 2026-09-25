import { Settings as SettingsIcon } from 'lucide-react'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import ModuleStageList from '../components/ModuleStageList'
import Badge from '../components/ui/Badge'
import { ROUTES } from '../routes'

const stages = [
  {
    title: 'Session preferences',
    description: 'Guest-mode behaviour and session handling options.',
  },
  {
    title: 'Accessibility and display',
    description: 'Text size, contrast and motion preferences for the application.',
  },
  {
    title: 'Data and privacy controls',
    description: 'Manage stored information and consent preferences.',
  },
]

const previewRows = [
  { label: 'Reduce motion', description: 'Disable entrance animations across the app.' },
  { label: 'Larger text', description: 'Increase base text size for readability.' },
  { label: 'Save session data', description: 'Available for signed-in accounts only.' },
]

export default function SettingsPage() {
  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Application"
        title="Settings"
        subtitle="Session, accessibility and data preferences for OA Assist."
        status="Planned"
        statusTone="neutral"
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
            <div className="flex items-center gap-2.5">
              <SettingsIcon className="h-5 w-5 text-plum-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-sage-900">Preferences</h2>
            </div>
            <Badge tone="neutral">Controls disabled</Badge>
          </div>

          <ul className="divide-y divide-line">
            {previewRows.map((row) => (
              <li
                key={row.label}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sage-900">{row.label}</p>
                  <p className="mt-0.5 text-sm text-ink-500">{row.description}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line-strong bg-sage-50 px-1"
                >
                  <span className="h-4 w-4 rounded-full bg-line-strong" />
                </span>
              </li>
            ))}
          </ul>

          <p className="border-t border-line bg-surface px-6 py-4 text-xs leading-relaxed text-ink-400">
            These rows are visual placeholders. Settings are not connected to any backend or
            storage yet.
          </p>
        </Card>

        <Card className="h-fit p-6 sm:p-8">
          <h2 className="text-base font-semibold text-sage-900">Planned settings</h2>
          <ModuleStageList stages={stages} className="mt-6" />
        </Card>
      </div>
    </div>
  )
}
