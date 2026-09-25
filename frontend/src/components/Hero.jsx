import { Link } from 'react-router-dom'
import { ArrowRight, ScanLine, ShieldCheck } from 'lucide-react'
import { buttonClasses } from './ui/buttonStyles'
import { ROUTES } from '../routes'
import HeroVisual from './HeroVisual'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface-warm">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_12%_0%,var(--color-sage-50),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--color-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-line)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sage-700 via-plum-400 to-plum-200" />

      <div className="container-page relative grid items-center gap-14 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="max-w-xl animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-plum-200 bg-plum-50 px-3 py-1 text-xs font-medium text-plum-700">
            <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
            AI-assisted osteoarthritis assessment
          </p>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-sage-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Understand Your Joint Health, Earlier.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-pretty text-ink-500">
            An AI-assisted platform for preliminary osteoarthritis assessment using medical
            imaging, gait patterns, and symptom information.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={ROUTES.signup}
              className={buttonClasses({
                variant: 'primary',
                size: 'lg',
                className: 'group w-full sm:w-auto',
              })}
            >
              Start Assessment
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              to={ROUTES.guest}
              className={buttonClasses({
                variant: 'secondary',
                size: 'lg',
                className: 'w-full sm:w-auto',
              })}
            >
              Continue as Guest
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-ink-500">
            <ShieldCheck className="h-4 w-4 text-sage-600" aria-hidden="true" />
            AI-assisted preliminary assessment &bull; Not a medical diagnosis
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}
