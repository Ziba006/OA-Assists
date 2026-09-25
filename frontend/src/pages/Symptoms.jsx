import { Link } from 'react-router-dom'
import { ClipboardList, Info, Lock } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import ModuleStageList from '../components/ModuleStageList'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

const questions = [
  {
    title: 'Pain intensity',
    description: 'How would you rate pain in the assessed joint over the past week?',
  },
  {
    title: 'Morning stiffness',
    description: 'How long does stiffness last after waking up?',
  },
  {
    title: 'Mobility and daily activity',
    description: 'Which daily activities are affected by joint discomfort?',
  },
  {
    title: 'Swelling and warmth',
    description: 'Have you noticed swelling or warmth around the joint?',
  },
]

const stages = [
  {
    title: 'Guided question flow',
    description: 'Step-by-step questions with plain language and progress indication.',
  },
  {
    title: 'Answer validation',
    description: 'Responses are checked for completeness before they are used.',
  },
  {
    title: 'Symptom summary',
    description: 'A structured symptom summary is added to the combined preliminary assessment.',
  },
]

export default function Symptoms() {
  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Assessment module"
        title="Symptom Assessment"
        step="Step 3 of 3"
        subtitle="Answer a few questions about your symptoms and mobility."
        status="Questionnaire planned"
        statusTone="brand"
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.title} className="p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-plum-50 text-xs font-semibold text-plum-700"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h2 className="text-base font-semibold text-sage-900">{question.title}</h2>
                </div>
                <Badge tone="neutral" dot>
                  Not available yet
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-500">{question.description}</p>

              <div className="mt-4 flex flex-wrap gap-2" aria-hidden="true">
                {['None', 'Mild', 'Moderate', 'Severe'].map((option) => (
                  <span
                    key={option}
                    className="rounded-lg border border-sage-200 bg-surface-warm px-3.5 py-2 text-sm text-ink-500"
                  >
                    {option}
                  </span>
                ))}
              </div>
            </Card>
          ))}

          <Card className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <ClipboardList className="h-6 w-6 text-sage-300" aria-hidden="true" />
            <p className="text-sm font-medium text-sage-900">Questionnaire coming next</p>
            <p className="max-w-md text-xs leading-relaxed text-ink-500">
              These cards are layout placeholders. No medical scoring or questionnaire logic has
              been implemented yet.
            </p>
            <span
              className={`${buttonClasses({ variant: 'primary', className: 'pointer-events-none opacity-70' })}`}
            >
              Submit answers
            </span>
          </Card>
        </div>

        <Card className="h-fit p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-sage-900">Module status</h2>
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            How questionnaire answers will flow into the combined assessment.
          </p>

          <ModuleStageList stages={stages} className="mt-6" />

          <div className="mt-6 flex gap-3 rounded-xl border border-line bg-surface px-4 py-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-500">
              Guest answers stay in the current session only and are never written to an account or
              a database.
            </p>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-line bg-surface px-4 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-500">
              OA Assist provides AI-assisted preliminary assessment and does not replace evaluation
              or diagnosis by a qualified healthcare professional.
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
