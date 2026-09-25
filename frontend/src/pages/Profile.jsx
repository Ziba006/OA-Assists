import { UserRound } from 'lucide-react'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/EmptyState'
import ModuleStageList from '../components/ModuleStageList'
import Badge from '../components/ui/Badge'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes'

const stages = [
  {
    title: 'Account details',
    description: 'Name, contact details and basic information for the account owner.',
  },
  {
    title: 'Consent and data management',
    description: 'Control over how assessment data is stored and shared.',
  },
  {
    title: 'Linked assessment history',
    description: 'Saved assessments are tied to the signed-in account.',
  },
]

export default function Profile() {
  const { isGuest } = useAuth()

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Your details and preferences will be managed here once accounts are connected."
        status={isGuest ? 'Guest session' : 'Authentication planned'}
        statusTone={isGuest ? 'warning' : 'neutral'}
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <EmptyState
            icon={UserRound}
            title="No profile yet"
            description="Authentication is not implemented in this prototype, so no account details are stored."
          />

          <Card className="mt-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-sage-900">Current session</h2>
              <Badge tone={isGuest ? 'sage' : 'brand'} dot>
                {isGuest ? 'Guest' : 'Prototype'}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {isGuest
                ? 'You are browsing as a guest. Nothing is written to a permanent profile.'
                : 'Session state is held in memory only until authentication is connected.'}
            </p>
          </Card>
        </div>

        <Card className="h-fit p-6 sm:p-8">
          <h2 className="text-base font-semibold text-sage-900">Planned profile content</h2>
          <ModuleStageList stages={stages} className="mt-6" />
        </Card>
      </div>
    </div>
  )
}
