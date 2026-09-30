import { useEffect, useRef } from 'react'
import { Loader2, X } from 'lucide-react'

import { buttonClasses } from './buttonStyles'

/**
 * A dialog that hosts a form.
 *
 * `ConfirmDialog` answers a yes/no question and has no room for fields, so this
 * is its sibling rather than a mode of it. The behaviour that makes a dialog a
 * dialog is deliberately identical to `ConfirmDialog` -- focus moves in on
 * open, Tab stays inside the panel, Escape and a click on the backdrop close it,
 * and the page behind cannot scroll. Keeping the two the same means the app has
 * one dialog to learn, not two.
 *
 * The caller supplies the fields as children and owns the save, so this stays
 * presentational: it does not know what is being edited or what a successful
 * save means.
 */
export default function FormDialog({
  isOpen = false,
  title,
  description,
  error = '',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  isBusy = false,
  isConfirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null)
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) {
        event.stopPropagation()
        onCancel()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      // Skip disabled controls, so Tab cannot stop on a button that cannot be
      // pressed, such as Save while the request is in flight.
      const focusable = panelRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
      )

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    cancelRef.current?.focus()

    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [isOpen, isBusy, onCancel])

  useEffect(() => {
    if (!isOpen) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={() => {
          if (!isBusy) onCancel()
        }}
        className="absolute inset-0 cursor-default bg-ink-900/35 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-dialog-title"
        aria-describedby="form-dialog-description"
        className="animate-fade-up relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface-warm p-6 shadow-lift"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-sage-50 hover:text-ink-700 disabled:opacity-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="form-dialog-title" className="text-lg font-semibold tracking-tight text-sage-900">
          {title}
        </h2>
        {description ? (
          <p
            id="form-dialog-description"
            className="mt-2 text-sm leading-relaxed text-ink-500"
          >
            {description}
          </p>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm leading-relaxed text-error-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className={buttonClasses({ variant: 'secondary', size: 'md' })}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy || isConfirmDisabled}
            className={buttonClasses({ variant: 'primary', size: 'md' })}
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}