export default function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="OA Assist logo">
      <rect width="64" height="64" rx="16" className="fill-brand-700" />
      <g fill="none" stroke="#e0f2fe" strokeWidth="4" strokeLinecap="round">
        <path d="M22 14v24a10 10 0 0 0 20 0V14" />
        <path d="M27 23h10M27 31h10" opacity="0.6" />
      </g>
      <circle cx="46" cy="45" r="6" className="fill-accent-400" />
    </svg>
  )
}
