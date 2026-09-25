const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55'

const variants = {
  // Primary CTA — plum
  primary:
    'bg-plum-500 text-cream shadow-sm hover:bg-plum-700 active:bg-plum-800 focus-visible:outline-plum-700',
  // Dark sage CTA for calm, low-emphasis actions
  sage: 'bg-sage-900 text-cream shadow-sm hover:bg-sage-800 focus-visible:outline-sage-800',
  // Secondary — warm white with sage/plum border and dark text
  secondary:
    'border border-line-strong bg-surface-warm text-sage-900 hover:border-sage-400 hover:bg-sage-50 focus-visible:outline-sage-600',
  ghost: 'text-ink-700 hover:bg-sage-50 hover:text-sage-900',
  onDark: 'border border-cream/25 bg-cream/5 text-cream hover:border-plum-300 hover:bg-cream/10',
  danger: 'border border-error-100 bg-surface-warm text-error-700 hover:bg-error-100',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm sm:text-base',
  lg: 'px-6 py-3 text-base',
}

export function buttonClasses({ variant = 'primary', size = 'md', className = '' } = {}) {
  return [baseClasses, variants[variant] ?? variants.primary, sizes[size] ?? sizes.md, className]
    .filter(Boolean)
    .join(' ')
}

export default buttonClasses
