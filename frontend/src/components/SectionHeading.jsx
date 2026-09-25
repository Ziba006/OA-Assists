export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'light',
  className = '',
}) {
  const isDark = tone === 'dark'
  const alignment = align === 'center' ? 'mx-auto text-center' : 'text-left'

  return (
    <div className={`max-w-2xl ${alignment} ${className}`}>
      {eyebrow ? (
        <p
          className={`text-xs font-semibold tracking-[0.18em] uppercase ${
            isDark ? 'text-sage-300' : 'text-plum-600'
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl ${
          isDark ? 'text-cream' : 'text-sage-900'
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base leading-relaxed text-pretty sm:text-lg ${
            isDark ? 'text-sage-200/80' : 'text-ink-500'
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
