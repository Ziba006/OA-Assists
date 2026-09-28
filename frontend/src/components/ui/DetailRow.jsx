/** Label/value row used for the plain details of a report or assessment. */
export default function DetailRow({ label, children }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">{label}</dt>
      <dd className="text-sm text-sage-900">{children}</dd>
    </div>
  )
}
