import { Boxes, Layers, MousePointerClick, Sparkles } from 'lucide-react'
import Container from './ui/Container'
import SectionHeading from './SectionHeading'
import { HOME_SECTIONS } from '../routes'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Assisted',
    description: 'Machine learning supports preliminary assessment.',
  },
  {
    icon: Layers,
    title: 'Multiple Inputs',
    description:
      'Imaging, gait and symptoms can provide complementary information.',
  },
  {
    icon: MousePointerClick,
    title: 'Simple Experience',
    description: 'Designed to be easy to understand and use.',
  },
  {
    icon: Boxes,
    title: 'Expandable',
    description:
      'The platform can later integrate wearable hardware, additional AI models and patient history.',
  },
]

export default function WhyOA() {
  return (
    <section id={HOME_SECTIONS.about} className="scroll-mt-20 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Why OA Assist"
          title="Designed for Early Awareness"
          description="Built around complementary signals and transparent limitations, so the output is useful without overstating what it can do."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
