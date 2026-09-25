export default function Card({
  as: Component = 'div',
  interactive = false,
  className = '',
  ...props
}) {
  const interaction = interactive
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-plum-300 hover:shadow-lift'
    : ''

  return (
    <Component
      className={`rounded-2xl border border-line bg-surface-warm shadow-card ${interaction} ${className}`}
      {...props}
    />
  )
}
