/**
 * A one-shot message for the page you are about to land on.
 *
 * Used for the note shown after a password change, where the Profile page ends
 * the session and the login page has to explain why. Router state was the
 * obvious choice and is the wrong one: ending the session makes the route guard
 * redirect to the login page itself, and that redirect lands after the manual
 * navigation and replaces the state it was carrying.
 *
 * This holds a plain sentence for the length of one page view and nothing else.
 * No token, no password and no account detail is ever stored here.
 */

const KEY = 'oa-assist.flash'

/** Queue a message for the next page. */
export function setFlashMessage(message) {
  if (!message) return

  try {
    window.sessionStorage.setItem(KEY, message)
  } catch {
    // Storage unavailable: the user simply will not be shown the note.
  }
}

/** Read and remove the queued message. Returns '' when there is none. */
export function takeFlashMessage() {
  try {
    const message = window.sessionStorage.getItem(KEY) || ''

    window.sessionStorage.removeItem(KEY)

    return message
  } catch {
    return ''
  }
}