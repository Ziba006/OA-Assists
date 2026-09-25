import { Link } from 'react-router-dom'
import Container from './ui/Container'
import SectionHeading from './SectionHeading'
import { buttonClasses } from './ui/buttonStyles'
import { ROUTES } from '../routes'

export default function FinalCTA() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="rounded-3xl border border-slate-200 bg-surface px-6 py-14 text-center shadow-soft sm:px-12">
          <SectionHeading
            title="Start Your Assessment"
            description="Explore AI-assisted tools designed to support preliminary osteoarthritis assessment."
          />

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={ROUTES.signup}
              className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              Get Started
            </Link>
            <Link
              to={ROUTES.guest}
              className={buttonClasses({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              Continue as Guest
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
