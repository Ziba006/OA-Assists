import { Link } from 'react-router-dom'
import Logo from './Logo'
import { HOME_SECTIONS, ROUTES } from '../routes'

const exploreLinks = [
  { label: 'Home', to: ROUTES.home },
  { label: 'How It Works', to: `${ROUTES.home}#${HOME_SECTIONS.howItWorks}` },
  { label: 'About', to: `${ROUTES.home}#${HOME_SECTIONS.about}` },
]

const assessmentLinks = [
  { label: 'X-Ray', to: ROUTES.xray },
  { label: 'Gait', to: ROUTES.gait },
  { label: 'Symptoms', to: ROUTES.symptoms },
  { label: 'Dashboard', to: ROUTES.dashboard },
]

const legalLinks = [
  { label: 'Privacy', to: `${ROUTES.home}#${HOME_SECTIONS.disclaimer}` },
  { label: 'Disclaimer', to: `${ROUTES.home}#${HOME_SECTIONS.disclaimer}` },
]

const linkClass = 'text-sm text-sage-200/80 transition-colors duration-200 hover:text-plum-200'

function FooterColumn({ title, links }) {
  return (
    <nav aria-label={`Footer ${title}`}>
      <h2 className="text-xs font-semibold tracking-[0.16em] text-sage-300/80 uppercase">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link className={linkClass} to={link.to}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer() {
  return (
    <footer className="bg-sage-900 text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo variant="onDark" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-plum-100/70">
            OA Assist provides AI-assisted preliminary assessment and does not replace evaluation
            or diagnosis by a qualified healthcare professional.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-cream/10 bg-cream/5 px-3 py-1 text-xs text-sage-200/80">
            AI-assisted osteoarthritis assessment
          </p>
        </div>

        <FooterColumn title="Explore" links={exploreLinks} />
        <FooterColumn title="Assessments" links={assessmentLinks} />
      </div>

      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-plum-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 OA Assist</p>
          <ul className="flex flex-wrap gap-5">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link className="transition-colors duration-200 hover:text-plum-200" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
