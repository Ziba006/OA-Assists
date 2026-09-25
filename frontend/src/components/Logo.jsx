import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'

export default function Logo({ className = '', to = '/', variant = 'default' }) {
  const isDark = variant === 'onDark'

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2.5 rounded-lg ${
        isDark ? 'text-white' : 'text-ink-900'
      } ${className}`}
      aria-label="OA Assist home"
    >
      <LogoMark className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-tight">OA Assist</span>
        <span
          className={`mt-1 text-[0.68rem] font-medium tracking-wide ${
            isDark ? 'text-brand-100/80' : 'text-ink-500'
          }`}
        >
          AI-assisted osteoarthritis assessment
        </span>
      </span>
    </Link>
  )
}
