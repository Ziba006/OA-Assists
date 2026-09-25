export default function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="OA Assist logo">
      <rect width="64" height="64" rx="16" className="fill-sage-900" />
      <rect
        x="1.25"
        y="1.25"
        width="61.5"
        height="61.5"
        rx="15"
        fill="none"
        className="stroke-plum-400/50"
        strokeWidth="1.5"
      />
      <g fill="none" stroke="#f7f4ed" strokeWidth="4" strokeLinecap="round">
        <path d="M22 14v24a10 10 0 0 0 20 0V14" />
        <path d="M27 23h10M27 31h10" opacity="0.55" />
      </g>
      <circle cx="46" cy="45" r="6" className="fill-plum-400" />
      <circle cx="46" cy="45" r="10" fill="none" className="stroke-plum-300" strokeOpacity="0.5" />
    </svg>
  )
}
