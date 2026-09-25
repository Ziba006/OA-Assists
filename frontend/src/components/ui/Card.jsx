export default function Card({ as: Component = 'div', className = '', ...props }) {
  return (
    <Component
      className={`rounded-2xl border border-slate-200 bg-white shadow-card ${className}`}
      {...props}
    />
  )
}
