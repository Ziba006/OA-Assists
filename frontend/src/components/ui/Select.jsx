/**
 * Native select styled to match `Input`.
 *
 * The project had no dropdown yet, and the patient form needs one for gender.
 * Keeping the markup, spacing and focus behaviour identical to `Input` means the
 * form reads as one component rather than two.
 */
export default function Select({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  autoComplete,
  error,
  hint,
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-sage-900">
        {label}
      </label>

      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 w-full appearance-none rounded-xl border bg-surface-warm px-4 py-2.5 text-sm text-ink-900 transition-colors duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-400 ${
          error ? 'border-error-500' : 'border-line-strong hover:border-sage-400'
        }`}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-error-700">
          {error}
        </p>
      ) : null}

      {!error && hint ? <p className="mt-1.5 text-xs text-ink-400">{hint}</p> : null}
    </div>
  )
}
