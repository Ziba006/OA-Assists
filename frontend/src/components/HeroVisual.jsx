import { Activity, ClipboardList, Footprints, Sparkles } from 'lucide-react'

const signals = [
  { label: 'Imaging', icon: Activity, value: 'X-ray analysed', width: 'w-[78%]' },
  { label: 'Movement', icon: Footprints, value: 'Gait signals', width: 'w-[62%]' },
  { label: 'Symptoms', icon: ClipboardList, value: 'Questionnaire', width: 'w-[88%]' },
]

function RadiographPanel() {
  return (
    <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 sm:aspect-square lg:aspect-4/5">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(45%_45%_at_50%_45%,rgba(148,231,233,0.35),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:36px_36px]"
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>
          <radialGradient id="bone" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#e2f7fb" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#7dd3d8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="78" fill="url(#bone)" />
        <g stroke="#e0f2fe" strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round">
          <path d="M86 26v44a14 14 0 0 0 28 0V26" />
          <path d="M74 172v-40a13 13 0 0 1 26 0v40" />
        </g>
        <path
          d="M100 74a30 30 0 1 1 0 52 30 30 0 0 1 0-52Z"
          stroke="#5eead4"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />
        <path
          d="M100 74a30 30 0 1 1 0 52 30 30 0 0 1 0-52Z"
          stroke="#5eead4"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[0.68rem] font-medium tracking-wide text-brand-100 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
        AI ANALYSIS
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/3 h-16 bg-[linear-gradient(to_bottom,transparent,rgba(94,234,212,0.16),transparent)]"
      />

      <div className="absolute inset-x-4 bottom-4 space-y-2 rounded-xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur">
        {signals.map(({ label, icon: Icon, value, width }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-slate-100">{label}</span>
                <span className="truncate text-[0.68rem] text-slate-400">{value}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full bg-teal-300/80 ${width}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HeroVisual() {
  return (
    <div className="relative w-full" aria-hidden="true">
      <div
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-50 via-white to-accent-50"
        aria-hidden="true"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <RadiographPanel />

        <div className="grid gap-4 sm:col-span-2 lg:col-span-1 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex items-center gap-2 text-brand-700">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">Signals</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-500">
              <li>Medical imaging</li>
              <li>Gait / IMU signals</li>
              <li>Symptom questionnaire</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex items-center gap-2 text-accent-700">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">Output</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              One preliminary assessment combining the available inputs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
