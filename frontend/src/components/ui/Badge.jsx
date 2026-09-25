const dotTones = {
  neutral: 'bg-sage-400',
  brand: 'bg-plum-500',
  accent: 'bg-plum-500',
  sage: 'bg-sage-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  dark: 'bg-sage-300',
}

export default function Badge({ tone = 'neutral', dot = false, className = '', children }) {
  const tones = {
    // Soft cream with subtle border
    neutral: 'border-line bg-surface-muted text-ink-700',
    // Prototype / plum accent
    brand: 'border-plum-200 bg-plum-50 text-plum-700',
    accent: 'border-plum-200 bg-plum-50 text-plum-700',
    // Planned / sage accent
    sage: 'border-sage-200 bg-sage-50 text-sage-700',
    success: 'border-success-100 bg-success-100 text-success-700',
    warning: 'border-warning-100 bg-warning-100 text-warning-700',
    dark: 'border-cream/15 bg-cream/10 text-sage-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
        tones[tone] ?? tones.neutral
      } ${className}`}
    >
      {dot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${dotTones[tone] ?? dotTones.neutral}`} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  )
}
