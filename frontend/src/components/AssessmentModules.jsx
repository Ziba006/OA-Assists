import { Activity, ClipboardList, ScanLine } from 'lucide-react'
import Container from './ui/Container'
import SectionHeading from './SectionHeading'
import FeatureCard from './FeatureCard'
import { HOME_SECTIONS, ROUTES } from '../routes'

const modules = [
  {
    icon: ScanLine,
    title: 'X-Ray Assessment',
    description: 'Analyze medical images using our AI-assisted imaging module.',
    actionLabel: 'Explore X-Ray',
    actionTo: ROUTES.xray,
  },
  {
    icon: Activity,
    title: 'Gait Assessment',
    description: 'Analyze walking patterns using wearable sensor data.',
    actionLabel: 'Explore Gait',
    actionTo: ROUTES.gait,
    badge: 'Hardware planned',
    note: 'Wearable sensor capture is part of the next stage; the software prototype covers the assessment flow only.',
  },
  {
    icon: ClipboardList,
    title: 'Symptom Assessment',
    description: 'Answer a simple questionnaire to provide additional context.',
    actionLabel: 'Explore Symptoms',
    actionTo: ROUTES.symptoms,
  },
]

export default function AssessmentModules() {
  return (
    <section id={HOME_SECTIONS.modules} className="scroll-mt-20 py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Assessment modules"
          title="One Platform. Multiple Signals."
          description="Combine different sources of information to support preliminary osteoarthritis assessment. No single module provides a diagnosis on its own."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <FeatureCard key={module.title} {...module} />
          ))}
        </div>
      </Container>
    </section>
  )
}
