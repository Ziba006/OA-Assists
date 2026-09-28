import { useEffect, useRef } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

import { buttonClasses } from './buttonStyles'

/**
 * A small confirmation dialog for destructive actions.
 *
 * Deliberately plain: the app has no modal or toast system yet, so this is the
 * one piece of shared chrome an irreversible action needs. It traps focus,
 * closes on Escape and on a click outside the panel, and marks itself as a
 * dialog for assistive technology.
 */
export default function ConfirmDialog({
  isOpen = false,
  title,
  description,
  error = '',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null)
  const cancelRef = useRef(null)

  // Escape closes, Tab stays inside the panel, and focus lands on Cancel so a
  // stray Enter cannot destroy anything.
  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) {
        event.stopPropagation()
        onCancel()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll('button:not([disabled])')

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

  // The page behind must not scroll while the dialog is open.
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="animate-fade-up relative w-full max-w-md rounded-2xl border border-line bg-surface-warm p-6 shadow-lift"
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

        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-error-100 text-error-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>

        <h2
          id="confirm-dialog-title"
          className="mt-4 text-lg font-semibold tracking-tight text-sage-900"
        >
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-relaxed text-ink-500">
          {description}
        </p>

        {error ? (
          <p role="alert" className="mt-3 text-sm leading-relaxed text-error-700">
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
            disabled={isBusy}
            className={buttonClasses({
              variant: 'primary',
              size: 'md',
              className: 'bg-error-500 hover:bg-error-700 focus-visible:outline-error-700',
            })}
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Deleting...
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
