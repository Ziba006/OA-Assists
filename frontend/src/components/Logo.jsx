import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'

export default function Logo({
  className = '',
  to = '/',
  variant = 'default',
  showSubtitle = true,
  ...props
}) {
  const isDark = variant === 'onDark'

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-3 rounded-lg ${
        isDark ? 'text-cream' : 'text-sage-900'
      } ${className}`}
      aria-label="OA Assist — go to home page"
      {...props}
    >
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-tight">OA Assist</span>
        {showSubtitle ? (
          <span
            className={`mt-1 text-[0.68rem] font-medium tracking-wide ${
              isDark ? 'text-sage-300/90' : 'text-ink-500'
            }`}
          >
            AI-assisted osteoarthritis assessment
          </span>
        ) : null}
      </span>
    </Link>
  )
}
