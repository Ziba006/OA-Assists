import { Info } from 'lucide-react'
import Container from './ui/Container'
import { HOME_SECTIONS } from '../routes'

export default function MedicalDisclaimer() {
  return (
    <section id={HOME_SECTIONS.disclaimer} className="scroll-mt-24 pb-16 sm:pb-20">
      <Container>
        <div
          role="note"
          className="flex gap-4 rounded-2xl border border-line bg-surface-warm p-5 sm:p-6"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sage-200 bg-sage-50 text-plum-600">
            <Info className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-sage-900">Medical disclaimer</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              OA Assist provides AI-assisted preliminary assessment and does not replace evaluation
              or diagnosis by a qualified healthcare professional. Results are intended to support
              informed conversations with your healthcare provider.
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
