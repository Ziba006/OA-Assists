import { useSyncExternalStore } from 'react'

/**
 * Whether the visitor has asked their operating system to reduce motion.
 *
 * `index.css` already neutralises the animations under
 * `@media (prefers-reduced-motion: reduce)`, so purely decorative motion needs
 * nothing from React. This hook exists for the cases where the *content* also
 * has to change, so the component does not have to duplicate a media query
 * string or listen for changes itself.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const listeners = new Set()

function matchesQuery() {
  if (typeof window.matchMedia !== 'function') return false

  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function subscribe(listener) {
  listeners.add(listener)

  // The first subscriber owns the media listener, so the preference is tracked
  // only while something is actually reading it.
  if (listeners.size === 1 && typeof window.matchMedia === 'function') {
    window
      .matchMedia(REDUCED_MOTION_QUERY)
      .addEventListener('change', () => {
        for (const current of listeners) current()
      })
  }

  return () => {
    listeners.delete(listener)
  }
}

/**
 * Read the reduced-motion preference.
 *
 * Falls back to `false` during server rendering, where there is no viewport to
 * ask, so callers only ever branch on it in the browser.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, matchesQuery, () => false)
}

export default usePrefersReducedMotion