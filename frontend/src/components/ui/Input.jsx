export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  disabled = false,
  required = false,
  min,
  max,
  inputMode,
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-sage-900">
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 w-full rounded-xl border bg-surface-warm px-4 py-2.5 text-sm text-ink-900 transition-colors duration-200 placeholder:text-ink-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-400 ${
          error ? 'border-error-500' : 'border-line-strong hover:border-sage-400'
        }`}
      />

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-error-700">
          {error}
        </p>
      ) : null}

      {!error && hint ? <p className="mt-1.5 text-xs text-ink-400">{hint}</p> : null}
    </div>
  )
}
