import { Link } from 'react-router-dom'
import Logo from './Logo'
import { HOME_SECTIONS, ROUTES } from '../routes'

const productLinks = [
  { label: 'X-Ray', to: ROUTES.xray },
  { label: 'Gait', to: ROUTES.gait },
  { label: 'Symptoms', to: ROUTES.symptoms },
]

const legalLinks = [
  { label: 'Privacy', to: `${ROUTES.home}#${HOME_SECTIONS.disclaimer}` },
  { label: 'Disclaimer', to: `${ROUTES.home}#${HOME_SECTIONS.disclaimer}` },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
            OA Assist provides AI-assisted preliminary assessment and does not replace
            evaluation or diagnosis by a qualified healthcare professional.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="text-sm font-semibold text-ink-900">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link className="text-ink-500 transition-colors hover:text-brand-700" to={ROUTES.home}>
                Home
              </Link>
            </li>
            <li>
              <Link
                className="text-ink-500 transition-colors hover:text-brand-700"
                to={`${ROUTES.home}#${HOME_SECTIONS.howItWorks}`}
              >
                How It Works
              </Link>
            </li>
            <li>
              <Link
                className="text-ink-500 transition-colors hover:text-brand-700"
                to={`${ROUTES.home}#${HOME_SECTIONS.about}`}
              >
                About
              </Link>
            </li>
          </ul>
        </nav>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:col-span-2 md:grid-cols-2">
          <nav aria-label="Assessment modules">
            <h2 className="text-sm font-semibold text-ink-900">Assessments</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-ink-500 transition-colors hover:text-brand-700"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold text-ink-900">Legal</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-ink-500 transition-colors hover:text-brand-700"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 OA Assist</p>
          <p>Software prototype — AI-assisted preliminary assessment, not a medical diagnosis.</p>
        </div>
      </div>
    </footer>
  )
}
