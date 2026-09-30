import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * A password field with a show/hide control.
 *
 * Styled to match `Input` exactly, so a password reads as the same kind of
 * field as the text inputs beside it. Showing the password is a deliberate
 * choice by the person typing it, and is reset to hidden whenever the field is
 * cleared so a value is never left on screen by accident.
 *
 * The value is passed in and out like any other input. Nothing here stores it,
 * logs it, or copies it anywhere.
 */
export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  disabled = false,
  required = false,
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-sage-900">
        {label}
      </label>

      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => {
            // Clearing the field also re-hides it.
            if (!event.target.value) setIsVisible(false)

            onChange(event.target.value)
          }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full appearance-none rounded-xl border bg-surface-warm py-2.5 pr-11 pl-4 text-sm text-ink-900 transition-colors duration-200 placeholder:text-ink-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-400 ${
            error ? 'border-error-500' : 'border-line-strong hover:border-sage-400'
          }`}
        />

        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          disabled={disabled}
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={isVisible}
          className="absolute top-1/2 right-1 -translate-y-1/2 rounded-lg p-2 text-ink-400 transition-colors hover:bg-sage-50 hover:text-ink-700 disabled:opacity-50"
        >
          {isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-error-700">
          {error}
        </p>
      ) : null}

      {!error && hint ? <p className="mt-1.5 text-xs text-ink-400">{hint}</p> : null}
    </div>
  )
}