import { Link } from 'react-router-dom'
import Container from './ui/Container'
import SectionHeading from './SectionHeading'
import { buttonClasses } from './ui/buttonStyles'
import { ROUTES } from '../routes'

export default function FinalCTA() {
  return (
    <section className="bg-surface-warm py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-sage-900 px-6 py-14 text-center shadow-soft sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(169,184,160,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(169,184,160,0.3)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)]"
          />
          <div className="relative">
            <SectionHeading
              title="Start Your Assessment"
              description="Explore AI-assisted tools designed to support preliminary osteoarthritis assessment."
              tone="dark"
            />

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={ROUTES.signup}
                className={buttonClasses({
                  variant: 'primary',
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                Get Started
              </Link>
              <Link
                to={ROUTES.guest}
                className={buttonClasses({
                  variant: 'onDark',
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                Continue as Guest
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
