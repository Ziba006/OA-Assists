import { Link } from 'react-router-dom'
import { ArrowRight, UserRound } from 'lucide-react'
import Container from './ui/Container'
import { buttonClasses } from './ui/buttonStyles'
import { HOME_SECTIONS, ROUTES } from '../routes'

export default function GuestCTA() {
  return (
    <section
      id={HOME_SECTIONS.guest}
      className="scroll-mt-20 border-y border-brand-800/20 bg-brand-900 py-16 sm:py-20"
    >
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              Guest mode
            </span>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
              Try OA Assist Without Creating an Account
            </h2>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-brand-100/85">
              Explore the assessment experience as a guest. Your session information is temporary
              and is not saved to a permanent profile.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={ROUTES.guest}
                className={buttonClasses({
                  variant: 'onDark',
                  size: 'lg',
                  className: 'group w-full bg-white text-brand-900 hover:bg-brand-50 sm:w-auto',
                })}
              >
                Continue as Guest
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <p className="text-sm text-brand-100/75">
                Create an account later to save assessment history.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              'No account required',
              'Temporary session only',
              'Nothing stored permanently',
              'Explore the full flow',
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-brand-50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
