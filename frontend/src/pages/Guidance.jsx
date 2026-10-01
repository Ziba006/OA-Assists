import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Accessibility,
  Activity,
  AlertTriangle,
  Apple,
  ArrowRight,
  Bean,
  Bike,
  Check,
  ChevronDown,
  CircleHelp,
  Drumstick,
  Footprints,
  HeartHandshake,
  HeartPulse,
  Info,
  Leaf,
  Lightbulb,
  MapPin,
  Minus,
  Milk,
  Sprout,
  Stethoscope,
  Wheat,
  Waves,
} from 'lucide-react'

import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ROUTES } from '../routes'

const SECTION_LABEL_CLASS =
  'text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-400'

/**
 * One accent per section.
 *
 * Sage, plum, sky and amber are already in the palette, so the page reads as one
 * system rather than a rainbow. Every tint here is a background or a hairline:
 * nothing carries a saturated fill, which keeps the page calm and clinical.
 */
const ACCENTS = {
  green: {
    chip: 'bg-sage-50 text-sage-600 ring-sage-200/80',
    item: 'bg-sage-50/70 text-sage-600',
    tip: 'bg-sage-50/60 border-sage-200/70',
    hair: 'border-sage-200/80',
  },
  blue: {
    chip: 'bg-sky-50 text-sky-600 ring-sky-200/80',
    item: 'bg-sky-50/70 text-sky-600',
    tip: 'bg-sky-50/60 border-sky-200/70',
    hair: 'border-sky-200/80',
  },
  plum: {
    chip: 'bg-plum-50 text-plum-600 ring-plum-200',
    item: 'bg-plum-50/70 text-plum-600',
    tip: 'bg-plum-50/60 border-plum-200/80',
    hair: 'border-plum-200/80',
  },
  amber: {
    chip: 'bg-warning-100 text-warning-700 ring-warning-500/25',
    item: 'bg-warning-100/70 text-warning-700',
    tip: 'bg-warning-100/50 border-warning-500/25',
    hair: 'border-warning-500/25',
  },
  peach: {
    chip: 'bg-peach-50 text-peach-700 ring-peach-200',
    item: 'bg-peach-50 text-peach-500',
    tip: 'bg-peach-50/70 border-peach-200/80',
    hair: 'border-peach-200/80',
  },
}

/**
 * Diet & Nutrition.
 *
 * Written as general healthy-eating suggestions. Nothing here claims a food
 * treats or prevents osteoarthritis, and none of it is a diet plan: what suits
 * one person is not what suits another.
 */
const foodsToChoose = [
  { icon: Apple, label: 'Vegetables and fruits' },
  { icon: Bean, label: 'Beans, pulses and lentils' },
  { icon: Wheat, label: 'Whole grains' },
  { icon: Drumstick, label: 'Protein-rich foods' },
  { icon: Milk, label: 'Calcium-rich foods' },
]

const eatingHabits = [
  'Include a source of protein with meals',
  'Stay adequately hydrated',
  'Prefer minimally processed foods',
  'Maintain a balanced overall diet',
]

const foodsToLimit = [
  'Highly processed foods',
  'Excess added sugar',
  'Excess saturated-fat-rich foods',
]

/** Movement worth considering, each with an icon so the card scans quickly. */
const activities = [
  { icon: Footprints, label: 'Walking' },
  { icon: Bike, label: 'Cycling' },
  { icon: Waves, label: 'Swimming / water exercise' },
  { icon: Accessibility, label: 'Gentle mobility exercises' },
]

/** Pacing principles, not a prescribed routine. */
const comfortHabits = [
  'Start gradually',
  'Choose activity that feels manageable',
  'Take breaks when needed',
  'Increase activity gradually if comfortable',
]

/** Everyday habits that may support comfort and mobility. */
const dailyHabits = [
  'Keep moving regularly',
  'Avoid staying in one position for very long',
  'Take breaks during longer activities',
  'Wear comfortable/supportive footwear',
  'Pace demanding activities',
  'Maintain a healthy body weight when appropriate',
]

/** Short, general nudges. Framing, not instruction for an individual. */
const tips = {
  diet: {
    label: 'Simple tip',
    body: 'Build meals around vegetables, a protein source and whole grains when possible.',
  },
  activity: {
    label: 'Movement tip',
    body: 'Choose activities that feel comfortable and increase activity gradually.',
  },
}

/**
 * Understanding OA, as four short explainers.
 *
 * The summaries describe what osteoarthritis is in general terms. They are not a
 * checklist for self-diagnosis: which symptoms apply to a person, and what they
 * mean, can only be established by a qualified healthcare professional.
 */
const explainers = [
  {
    id: 'what',
    icon: CircleHelp,
    tone: 'green',
    title: 'What is osteoarthritis?',
    summary:
      'Osteoarthritis is a common condition in which the cartilage that cushions a joint gradually changes.',
    detail:
      'It is one of a group of conditions affecting the joints, and it is not the same as rheumatoid arthritis or other inflammatory conditions. Osteoarthritis is not something that can be reversed, and how it progresses varies a lot from person to person.',
  },
  {
    id: 'symptoms',
    icon: HeartPulse,
    tone: 'plum',
    title: 'Common symptoms',
    summary:
      'People commonly notice stiffness, discomfort or reduced movement in a joint, often after activity.',
    detail:
      'Symptoms are not the same in everyone, and the same symptoms can have many different causes. Reading about symptoms is a way to recognise what to mention to a professional, not a way to work out what is wrong. Nothing on this page can tell you whether you have osteoarthritis.',
  },
  {
    id: 'risk',
    icon: AlertTriangle,
    tone: 'peach',
    title: 'Risk factors',
    summary:
      'Age, previous joint injury, body weight and genetics are among the factors associated with osteoarthritis.',
    detail:
      'Risk factors describe likelihood across a population, not certainty for an individual person. Having one or more of them does not mean a condition is present, and their effect differs from person to person.',
  },
  {
    id: 'assessment',
    icon: ArrowRight,
    tone: 'blue',
    title: 'When to consider professional assessment',
    summary:
      'It is worth seeking advice when joint discomfort persists, worsens, or starts to limit everyday activity.',
    detail:
      'A qualified healthcare professional can assess symptoms properly, consider your history and examination findings, and discuss whether any further investigation is appropriate. OA Assist produces a preliminary, AI-assisted screening result and is not a substitute for that assessment.',
  },
]

/** A section banner: a large tinted icon beside the title and one framing line. */
function SectionHeading({ icon: Icon, tone, title, subtitle }) {
  return (
    <div className="flex flex-wrap items-start gap-4 sm:gap-5">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${ACCENTS[tone].chip}`}
        aria-hidden="true"
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-xl font-semibold tracking-tight text-sage-900 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.95rem] leading-relaxed text-ink-500">{subtitle}</p>
      </div>
    </div>
  )
}

/** A compact group of items, ticked, bulleted, dashed, or icon-led. */
function GroupCard({ title, items, kind = 'check', icon: Icon, tone = 'green' }) {
  const marker = {
    check: (
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ACCENTS[tone].item}`}
      >
        <Check className="h-3 w-3" aria-hidden="true" />
      </span>
    ),
    bullet: (
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" aria-hidden="true" />
    ),
    limit: (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-peach-50">
        <Minus className="h-3 w-3" aria-hidden="true" />
      </span>
    ),
  }[kind]

  const alignment = kind === 'bullet' ? 'items-start' : 'items-center'

  return (
    <Card className={`flex h-full flex-col p-5 sm:p-6 ${ACCENTS[tone].hair} border`}>
      <div className="flex items-center gap-2.5">
        {Icon ? (
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${ACCENTS[tone].item}`}
            aria-hidden="true"
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <h3 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
          {title}
        </h3>
      </div>

      <ul className="mt-4 space-y-2.5">
        {items.map((item) => {
          const label = typeof item === 'string' ? item : item.label
          const RowIcon = typeof item === 'string' ? null : item.icon

          return (
            <li
              key={label}
              className={`flex gap-3 text-[0.95rem] leading-relaxed text-ink-700 ${alignment}`}
            >
              {RowIcon ? (
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ACCENTS[tone].item}`}
                  aria-hidden="true"
                >
                  <RowIcon className="h-4 w-4" />
                </span>
              ) : (
                <span className="mt-0.5 shrink-0">{marker}</span>
              )}
              <span className="pt-1.5">{label}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/** A short, clearly-labelled general tip. */
function TipCard({ tone, label, children }) {
  return (
    <div className={`flex items-start gap-3.5 rounded-2xl border px-5 py-4 ${ACCENTS[tone].tip}`}>
      <Lightbulb
        className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${tone === 'blue' ? 'text-sky-600' : 'text-sage-600'}`}
        aria-hidden="true"
      />
      <p className="text-[0.95rem] leading-relaxed text-ink-700">
        <span className="font-semibold text-ink-900">{label}: </span>
        {children}
      </p>
    </div>
  )
}

/** A highlighted caution, deliberately the only warning-toned block on the page. */
function SafetyNote({ children }) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-warning-500/30 bg-warning-100/50 px-5 py-4">
      <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-warning-700" aria-hidden="true" />
      <p className="text-[0.95rem] leading-relaxed text-ink-700">{children}</p>
    </div>
  )
}

/** A short explainer that opens into more detail. */
function ExplainerCard({ item, isOpen, onToggle }) {
  const panelId = `guidance-explainer-${item.id}`
  const accent = ACCENTS[item.tone]

  return (
    <Card
      className={`flex h-full flex-col p-5 transition-colors duration-200 sm:p-6 ${accent.hair} border ${
        isOpen ? 'bg-surface-warm ring-1 ring-plum-200/60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.item}`}
          aria-hidden="true"
        >
          <item.icon className="h-4.5 w-4.5" />
        </span>
        <h3 className="pt-1 text-base font-semibold tracking-tight text-sage-900">
          {item.title}
        </h3>
      </div>

      <p className="mt-3.5 text-[0.95rem] leading-relaxed text-ink-500">{item.summary}</p>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className={buttonClasses({
            variant: 'secondary',
            size: 'sm',
            className: 'w-full',
          })}
        >
          {isOpen ? 'Show less' : 'Learn More'}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <p
            id={panelId}
            className="animate-fade-in mt-3 border-l-2 border-plum-200 pl-3.5 text-[0.95rem] leading-relaxed text-ink-500"
          >
            {item.detail}
          </p>
        ) : null}
      </div>
    </Card>
  )
}

/**
 * Care & Guidance.
 *
 * A read-only, general-information toolkit. It reads nothing from the API,
 * stores nothing and derives nothing: the same content appears whoever opens
 * it, and it is not connected to any patient's X-ray or symptoms. Everything on
 * it is framed as general information to consider and to raise with a
 * qualified healthcare professional, which is why the scope notice comes first,
 * the wording stays conditional, and the next-step card points at a
 * professional rather than at a product.
 */
export default function Guidance() {
  const [openExplainer, setOpenExplainer] = useState('')

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Support"
        title="Care & Guidance"
        subtitle="General information to support healthy joints and informed next steps."
        status="Supportive Information"
        statusTone="brand"
        backTo={ROUTES.dashboard}
      />

      {/* Scope notice, before anything else. A calm banner, not a headline. */}
      <div
        className="animate-fade-up mt-8 flex gap-4 rounded-2xl border border-plum-200/70 bg-plum-50/50 px-6 py-5"
        style={{ animationDelay: '40ms' }}
      >
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum-100 text-plum-600"
          aria-hidden="true"
        >
          <Info className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-sage-900">General information only</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            This page offers general educational information to support healthy joints and
            informed next steps. It is not a diagnosis, and it is not a personalised medical
            prescription, treatment plan or diet plan. Individual needs vary, so anything here
            should be discussed with a qualified healthcare professional before it is applied.
          </p>
        </div>
      </div>

      {/* Diet & Nutrition */}
      <section
        aria-label="Diet and nutrition"
        className="animate-fade-up mt-14 border-t border-line/60 pt-10"
        style={{ animationDelay: '60ms' }}
      >
        <SectionHeading
          icon={Leaf}
          tone="green"
          title="Diet & Nutrition"
          subtitle="Simple healthy-eating habits that can support overall health."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <GroupCard
            title="Choose more often"
            items={foodsToChoose}
            kind="bullet"
            icon={Sprout}
            tone="green"
          />
          <GroupCard
            title="Healthy habits"
            items={eatingHabits}
            icon={Check}
            tone="green"
          />
        </div>

        <div className="mt-5">
          <GroupCard
            title="Limit when possible"
            items={foodsToLimit}
            kind="limit"
            icon={AlertTriangle}
            tone="peach"
          />
        </div>

        <div className="mt-5">
          <TipCard tone="green" label={tips.diet.label}>
            {tips.diet.body}
          </TipCard>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-400">
          These are general healthy-eating suggestions, not a personalised diet plan. No food
          cures or prevents osteoarthritis.
        </p>
      </section>

      {/* Physical Activity */}
      <section
        aria-label="Physical activity"
        className="animate-fade-up mt-14 border-t border-line/60 pt-10"
        style={{ animationDelay: '80ms' }}
      >
        <SectionHeading
          icon={Activity}
          tone="blue"
          title="Physical Activity"
          subtitle="Regular, comfortable movement can support mobility and overall health."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card className="border border-sky-200/80 p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600"
                aria-hidden="true"
              >
                <Footprints className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
                Activities to consider
              </h3>
            </div>

            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {activities.map((activity) => {
                const Icon = activity.icon

                return (
                  <li
                    key={activity.label}
                    className="flex items-center gap-3 rounded-xl border border-sky-200/60 bg-sky-50/50 px-4 py-3"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm leading-snug text-ink-700">{activity.label}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <GroupCard
            title="Keep it comfortable"
            items={comfortHabits}
            icon={Check}
            tone="blue"
          />
        </div>

        <div className="mt-5">
          <TipCard tone="blue" label={tips.activity.label}>
            {tips.activity.body}
          </TipCard>
        </div>

        <div className="mt-3">
          <SafetyNote>
            If an activity causes significant or persistent pain, stop and discuss it with a
            healthcare professional.
          </SafetyNote>
        </div>
      </section>

      {/* Joint Care & Lifestyle */}
      <section
        aria-label="Joint care and lifestyle"
        className="animate-fade-up mt-14 border-t border-line/60 pt-10"
        style={{ animationDelay: '100ms' }}
      >
        <SectionHeading
          icon={HeartHandshake}
          tone="plum"
          title="Joint Care & Lifestyle"
          subtitle="Everyday habits that may support joint comfort and mobility."
        />

        <div className="mt-6">
          <h3 className={SECTION_LABEL_CLASS}>Daily habits</h3>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dailyHabits.map((habit) => (
              <li key={habit}>
                <Card className="flex h-full items-start gap-3 border border-plum-200/70 p-4">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plum-50 text-plum-600"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-sm leading-relaxed text-ink-700">{habit}</span>
                </Card>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-400">
          These are general lifestyle suggestions rather than treatment. A qualified healthcare
          professional can advise what is appropriate for an individual.
        </p>
      </section>

      {/* Understanding OA */}
      <section
        aria-label="Understanding osteoarthritis"
        className="animate-fade-up mt-14 border-t border-line/60 pt-10"
        style={{ animationDelay: '120ms' }}
      >
        <SectionHeading
          icon={Stethoscope}
          tone="amber"
          title="Understanding OA"
          subtitle="Background reading on what osteoarthritis is, and when it is worth asking a professional."
        />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {explainers.map((item) => (
            <ExplainerCard
              key={item.id}
              item={item}
              isOpen={openExplainer === item.id}
              onToggle={() =>
                setOpenExplainer((current) => (current === item.id ? '' : item.id))
              }
            />
          ))}
        </div>
      </section>

      {/* Next step */}
      <section aria-label="Professional care" className="animate-fade-up mt-14">
        <div className="overflow-hidden rounded-2xl border border-plum-200/70 bg-plum-50/40">
          <Card className="flex flex-wrap items-start justify-between gap-6 border-0 bg-transparent p-6 shadow-none sm:p-8">
            <div className="flex min-w-0 gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-plum-100 text-plum-600"
                aria-hidden="true"
              >
                <Stethoscope className="h-6 w-6" />
              </span>

              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-sage-900 sm:text-xl">
                  Looking for professional care?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
                  If you have persistent or worsening symptoms, consider discussing them with a
                  qualified healthcare professional.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <Link
                to={ROUTES.nearbyDoctors}
                className={buttonClasses({ variant: 'primary', className: 'w-full sm:w-auto' })}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Find Nearby Doctors
              </Link>
              <p className="text-xs text-ink-400">
                Opens the OA Assist healthcare directory.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
