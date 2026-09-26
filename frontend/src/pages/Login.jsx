import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, LogIn, ShieldCheck } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ApiError, isApiConfigured } from '../services/api'
import { login } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../routes'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const initialForm = { email: '', password: '' }

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  /** Simple checks in the browser so the user gets instant feedback. */
  const validate = () => {
    const errors = {}

    if (!form.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      errors.password = 'Password is required.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  /** Turn a failed request into a message the user can act on. */
  const describeError = (error) => {
    if (!(error instanceof ApiError)) {
      return 'Something went wrong. Please try again.'
    }

    // The backend could not be reached at all.
    if (error.status === 0) {
      return 'Cannot reach the OA Assist server. Make sure the backend is running, then try again.'
    }

    // Wrong email or password. The backend already returns a clear message.
    if (error.status === 401) {
      return error.message
    }

    // The request itself was rejected, for example a malformed email address.
    if (error.status === 422) {
      return 'Please check the details you entered and try again.'
    }

    return error.message
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // Prevents a second request while one is already running.
    if (isSubmitting) return

    if (!validate()) return

    setIsSubmitting(true)
    setFormError('')

    try {
      const { user } = await login({
        email: form.email.trim(),
        password: form.password,
      })

      // Mirror the stored user into React state. The password is never kept.
      setForm(initialForm)
      signIn(user)
      navigate(ROUTES.dashboard)
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors ?? {})
      }

      setFormError(describeError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-md animate-fade-up">
        <Card className="p-8 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-900 text-plum-300">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-sage-900">Login</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Sign in to your OA Assist account. You can also continue as a guest to explore the
            assessment flow without creating an account.
          </p>

          <Badge tone={isApiConfigured() ? 'sage' : 'warning'} className="mt-5">
            {isApiConfigured() ? 'Connected to OA Assist API' : 'API address not configured'}
          </Badge>

          {formError ? (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-xl border border-error-100 bg-error-100 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-700" aria-hidden="true" />
              <p className="text-sm text-error-700">{formError}</p>
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="test@example.com"
              autoComplete="email"
              error={fieldErrors.email}
              disabled={isSubmitting}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
              error={fieldErrors.password}
              disabled={isSubmitting}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={buttonClasses({
                variant: 'primary',
                className: 'group w-full',
              })}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <Link
              to={ROUTES.guest}
              className={buttonClasses({ variant: 'secondary', className: 'w-full' })}
            >
              Continue as Guest
            </Link>
            <Link
              to={ROUTES.signup}
              className={buttonClasses({ variant: 'ghost', className: 'w-full' })}
            >
              New to OA Assist? Create an account
            </Link>
            <Link
              to={ROUTES.home}
              className={buttonClasses({ variant: 'ghost', className: 'w-full' })}
            >
              Back to home
            </Link>
          </div>
        </Card>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" aria-hidden="true" />
          OA Assist provides AI-assisted preliminary assessment and does not replace evaluation or
          diagnosis by a qualified healthcare professional.
        </p>
      </div>
    </div>
  )
}
