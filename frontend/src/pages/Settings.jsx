import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  Cpu,
  Info,
  KeyRound,
  LogOut,
  MapPin,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { ROUTES } from '../routes'

/**
 * Application settings.
 *
 * Only settings that genuinely work appear as settings. The one preference the
 * app really has is its appearance, so that is the only switch here, and it is
 * wired to the single theme store in `useTheme`, which persists the choice and
 * applies it across every page.
 *
 * Everything else on this page is either an honest notice about how the app
 * already handles data, or a row marked Coming Soon because the backend behind
 * it does not exist. There are no switches that look live and do nothing, and
 * no destructive action, because there is no backend flow that could carry one
 * out safely.
 */

/** A section wrapper: icon, heading, and the rows that belong to it. */
function Section({ id, title, icon: Icon, children }) {
  return (
    <section aria-labelledby={id} className="mt-6">
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-plum-600" aria-hidden="true" />
        <h2 id={id} className="text-base font-semibold text-sage-900">
          {title}
        </h2>
      </div>

      <Card className="mt-4 overflow-hidden">{children}</Card>
    </section>
  )
}

/** A label, description and control, with a hairline between rows. */
function Row({ label, description, icon: Icon, children, last = false }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
        last ? '' : 'border-b border-line'
      }`}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon ? (
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink-500"
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}

        <div className="min-w-0">
          <p className="text-sm font-medium text-sage-900">{label}</p>
          {description ? (
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-500">{description}</p>
          ) : null}
        </div>
      </div>

      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  )
}

/** The appearance switch. A real button, not a styled div. */
function Toggle({ isOn, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-700 ${
        isOn ? 'border-plum-700 bg-plum-700' : 'border-line-strong bg-surface-muted'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-cream shadow-sm transition-transform duration-200 ${
          isOn ? 'translate-x-6' : 'translate-x-1'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

/** A row for a setting the backend does not support yet. */
function ComingSoon({ description }) {
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Badge tone="warning">Coming Soon</Badge>
      <p className="text-xs leading-relaxed text-ink-400 sm:max-w-[16rem] sm:text-right">
        {description}
      </p>
    </div>
  )
}

/**
 * The small About card.
 *
 * Deliberately limited to what can be said truthfully: what the platform is,
 * that it is preliminary rather than diagnostic, and that it is an academic
 * prototype. No claims about certification, clinical validation or approval.
 */
function AboutCard({ onClose }) {
  return (
    <Card
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-oa-assist-title"
      className="mt-4 border-plum-200 p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id="about-oa-assist-title" className="text-base font-semibold text-sage-900">
            OA Assist
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            AI-assisted preliminary osteoarthritis assessment platform.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-500 transition-colors hover:bg-sage-50 hover:text-sage-900"
        >
          Close
        </button>
      </div>

      <ul className="mt-5 space-y-3 border-t border-line pt-5">
        <li className="text-sm leading-relaxed text-ink-500">
          Designed as an academic/project prototype.
        </li>
        <li className="text-sm leading-relaxed text-ink-500">
          Assessment results are preliminary and are not a medical diagnosis.
        </li>
      </ul>
    </Card>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [showAbout, setShowAbout] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const handleSignOut = () => {
    // The existing sign-out path, unchanged: clear the stored session, then go
    // to the login page. This page adds no second logout implementation.
    signOut()
    setConfirmSignOut(false)
    navigate(ROUTES.login)
  }

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Application"
        title="Settings"
        subtitle="Manage your OA Assist preferences and application settings."
        status="App Settings"
        statusTone="brand"
        backTo={ROUTES.dashboard}
      />

      {/* Appearance */}
      <Section id="appearance-heading" title="Appearance" icon={Moon}>
        <Row
          label="Dark Mode"
          description="Switch between light and dark appearance."
          icon={Moon}
          last
        >
          <Toggle isOn={isDark} onToggle={toggleTheme} label="Dark Mode" />
        </Row>
      </Section>

      {/* Notifications */}
      <Section id="notifications-heading" title="Notifications" icon={Bell}>
        <Row
          label="Assessment Updates"
          description="Receive updates related to assessment activity."
          icon={Bell}
        >
          <ComingSoon description="The app has no notification system yet." />
        </Row>

        <Row
          label="System Updates"
          description="Receive important OA Assist application updates."
          icon={Bell}
          last
        >
          <ComingSoon description="The app has no notification system yet." />
        </Row>
      </Section>

      {/* Privacy & Data */}
      <Section id="privacy-heading" title="Privacy & Data" icon={ShieldCheck}>
        <Row
          label="Patient Data"
          description="Patient assessments are associated with the authenticated account and are protected by user access controls."
          icon={ShieldCheck}
        />

        <Row
          label="Location"
          description="Location used for Nearby Doctors is used to find healthcare providers and is not stored as part of the patient assessment."
          icon={MapPin}
        />

        <Row
          label="AI Assessment"
          description="AI-generated assessment results are preliminary and should not be treated as a medical diagnosis."
          icon={Cpu}
          last
        />
      </Section>

      {/* Application */}
      <Section id="application-heading" title="Application" icon={SettingsIcon}>
        <Row label="Language" description="The language used throughout the application." icon={Info}>
          <span className="text-sm text-ink-500">English</span>
        </Row>

        <Row
          label="About OA Assist"
          description="What this platform is, and what it is not."
          icon={Info}
        >
          <button
            type="button"
            onClick={() => setShowAbout((open) => !open)}
            aria-expanded={showAbout}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            {showAbout ? 'Hide' : 'About'}
          </button>
        </Row>

        {/* No version row: the project has no version value the app can read,
            and inventing one would be a claim about the software that is not
            true. */}
      </Section>

      {showAbout ? <AboutCard onClose={() => setShowAbout(false)} /> : null}

      {/* Account */}
      <Section id="account-heading" title="Account" icon={UserRound}>
        <Row
          label="Profile"
          description="Your account details and activity."
          icon={UserRound}
        >
          <button
            type="button"
            onClick={() => navigate(ROUTES.profile)}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            Profile
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </Row>

        {/* No password, token, API key or database field is shown or reachable
            from this page. Logging out is the only account action the backend
            supports today, and there is deliberately no delete-account or
            delete-data action, because no secure flow for them exists. */}
        <Row
          label="Log Out"
          description="Sign out of this account on this device."
          icon={LogOut}
          last
        >
          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            className={buttonClasses({ variant: 'danger', size: 'sm' })}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log Out
          </button>
        </Row>
      </Section>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-400">
        <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Your appearance preference is stored in this browser only. It is not sent to the server and
        is not tied to your account.
      </p>

      <ConfirmDialog
        isOpen={confirmSignOut}
        title="Log out of OA Assist?"
        description="You will be returned to the login page and will need to sign in again to see your account."
        confirmLabel="Log Out"
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  )
}
