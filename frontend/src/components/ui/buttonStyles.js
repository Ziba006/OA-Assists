const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

const variants = {
  primary:
    'bg-brand-700 text-white shadow-sm hover:bg-brand-800 active:bg-brand-900 focus-visible:outline-brand-800',
  accent:
    'bg-accent-600 text-white shadow-sm hover:bg-accent-700 active:bg-accent-800 focus-visible:outline-accent-800',
  secondary:
    'border border-slate-300 bg-white text-ink-900 hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-brand-600',
  ghost: 'text-ink-700 hover:bg-brand-50 hover:text-brand-800',
  onDark: 'border border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white',
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
