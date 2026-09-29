import { useCallback, useSyncExternalStore } from 'react'

/**
 * The application's appearance preference.
 *
 * This is the **only** place theme state lives. Every component that needs to
 * know whether the app is dark reads it from here, so there is exactly one
 * answer to "what is the current theme" and no second system to drift from it.
 *
 * How it works:
 * - The chosen value is stored in localStorage under `THEME_STORAGE_KEY`, so
 *   the choice survives a refresh without needing an account or a backend call.
 * - The value is written to `document.documentElement` as `data-theme`. The
 *   dark palette is scoped to that attribute in `index.css`, so flipping it
 *   restyles the whole application at once, including pages that know nothing
 *   about themes.
 * - Until the visitor picks a theme themselves, the app follows the operating
 *   system preference. Once they choose, their choice wins and the system
 *   preference is no longer consulted, so it cannot quietly undo them.
 * - The same localStorage key is read by a small inline script in index.html
 *   before the first paint, which is what stops a dark-mode user seeing a flash
 *   of the light theme on every page load.
 */

/** Shared with the inline script in index.html, which must run before React. */
export const THEME_STORAGE_KEY = 'oa_assist_theme'

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Listeners for the tiny store, so every `useTheme()` caller stays in step. */
const listeners = new Set()

/** Read the stored choice. Returns null when the visitor has not chosen. */
function readStored() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)

    return stored === THEME_DARK || stored === THEME_LIGHT ? stored : null
  } catch {
    // Private browsing or a blocked storage area. The app still works; the
    // choice just will not survive a refresh.
    return null
  }
}

function systemTheme() {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
    ? THEME_DARK
    : THEME_LIGHT
}

/**
 * The theme in effect: the stored choice when there is one, otherwise whatever
 * the operating system asks for.
 */
function currentTheme() {
  if (typeof document === 'undefined') return THEME_LIGHT

  const applied = document.documentElement.dataset.theme

  if (applied === THEME_DARK || applied === THEME_LIGHT) return applied

  return readStored() ?? systemTheme()
}

/** Put the theme on the document, and tell the browser which scheme it is. */
function applyTheme(theme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  root.dataset.theme = theme
  // Makes native controls, form fields and the scrollbar match the theme.
  root.style.colorScheme = theme
}

/** Push the current theme out to every subscriber. */
function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener) {
  listeners.add(listener)

  // The first subscriber drives the system-preference listener, so an app with
  // no mounted theme UI still reacts to the OS changing its mind.
  if (listeners.size === 1) {
    if (typeof window.matchMedia === 'function') {
      window
        .matchMedia(DARK_QUERY)
        .addEventListener('change', () => {
          // An explicit choice outranks the system, so only follow the system
          // while the visitor has not chosen for themselves.
          if (readStored()) return

          applyTheme(systemTheme())
          emit()
        })
    }
  }

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return currentTheme()
}

/** Persist and apply a theme, and record that it was a deliberate choice. */
function setTheme(theme) {
  if (theme !== THEME_DARK && theme !== THEME_LIGHT) return

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage is unavailable. The theme still applies for this page view.
  }

  applyTheme(theme)
  emit()
}

/**
 * Read and change the appearance preference.
 *
 * Returns the current theme, a setter, and a convenience toggle for the switch
 * on the Settings page.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => THEME_LIGHT)
  const isDark = theme === THEME_DARK

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK)
  }, [])

  return { theme, isDark, setTheme, toggleTheme }
}

export default useTheme
