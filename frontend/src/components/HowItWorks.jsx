import { ClipboardList, FileText, PlayCircle, UserRound } from 'lucide-react'
import Container from './ui/Container'
import SectionHeading from './SectionHeading'
import { HOME_SECTIONS } from '../routes'

const steps = [
  {
    number: '01',
    icon: UserRound,
    title: 'Start',
    description: 'Login or continue as a guest.',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Provide Information',
    description: 'Upload an X-ray, provide gait data, or answer symptom questions.',
  },
  {
    number: '03',
    icon: PlayCircle,
    title: 'AI Analysis',
    description: 'The available information is processed by the relevant AI-assisted module.',
  },
  {
    number: '04',
    icon: FileText,
    title: 'Assessment Report',
    description: 'View a preliminary assessment and observations.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id={HOME_SECTIONS.howItWorks}
      className="scroll-mt-24 border-y border-line bg-surface-warm py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          eyebrow="How OA Assist Works"
          title="How OA Assist Works"
          description="A simple four-step flow that keeps you in control of the information you share."
        />

        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, icon: Icon, title, description }, index) => (
            <li key={number} className="relative flex flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-900 text-plum-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-2xl font-semibold tracking-tight text-sage-300">
                  {number}
                </span>
              </div>

              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-11 top-6 hidden h-px w-[calc(100%-2.75rem)] bg-gradient-to-r from-line-strong to-transparent lg:block"
                />
              ) : null}

              <h3 className="mt-5 text-base font-semibold text-sage-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
