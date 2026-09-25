export default function Badge({ tone = 'neutral', className = '', children }) {
  const tones = {
    neutral: 'border-slate-200 bg-slate-50 text-ink-500',
    brand: 'border-brand-200 bg-brand-50 text-brand-800',
    accent: 'border-accent-200 bg-accent-50 text-accent-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide ${
        tones[tone] ?? tones.neutral
      } ${className}`}
    >
      {children}
    </span>
  )
}
