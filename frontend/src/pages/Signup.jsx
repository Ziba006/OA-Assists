import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ApiError, isApiConfigured } from '../services/api'
import { signup } from '../services/authService'
import { ROUTES } from '../routes'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

const initialForm = { fullName: '', email: '', password: '' }

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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

    if (!form.fullName.trim()) {
      errors.fullName = 'Full name is required.'
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      errors.password = 'Password is required.'
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // Prevents a second request while one is already running.
    if (isSubmitting) return

    if (!validate()) return

    setIsSubmitting(true)
    setFormError('')

    try {
      const data = await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      // The password is never stored, logged or displayed anywhere.
      setForm(initialForm)
      setSuccessMessage(data?.message ?? 'Account created successfully')

      // Send the user to the existing login page.
      setTimeout(() => navigate(ROUTES.login), 1200)
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors ?? {})
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-md animate-fade-up">
        <Card className="p-8 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-900 text-plum-300">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-sage-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Creating an account will let you save assessment history. You can also continue as a
            guest at any time.
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

          {successMessage ? (
            <div
              role="status"
              className="mt-6 flex gap-3 rounded-xl border border-success-100 bg-success-100 px-4 py-3"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-success-700"
                aria-hidden="true"
              />
              <p className="text-sm text-success-700">
                {successMessage} Taking you to the login page…
              </p>
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <Input
              id="fullName"
              label="Full name"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Test User"
              autoComplete="name"
              error={fieldErrors.fullName}
              disabled={isSubmitting}
              required
            />

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              hint={`Minimum ${MIN_PASSWORD_LENGTH} characters. Stored securely as a hash.`}
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
                  Creating account…
                </>
              ) : (
                'Create account'
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
              to={ROUTES.login}
              className={buttonClasses({ variant: 'ghost', className: 'w-full' })}
            >
              Already have an account? Go to Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
