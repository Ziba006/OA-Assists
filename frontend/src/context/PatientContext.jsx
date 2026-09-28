import { createContext, useCallback, useMemo, useState } from 'react'

/**
 * Holds the patient the user is currently working with, for this browser session
 * only.
 *
 * Patient records are account data, so nothing here is written to localStorage
 * and nothing is put in the URL: the symptoms and report pages read the same
 * patient the X-ray page assessed without it ever appearing in the address bar.
 *
 * The state is deliberately in memory only. A page refresh clears it, so a page
 * that needs a patient must handle "no patient selected" and offer a way back to
 * patient selection rather than assuming one is there.
 */
export const PatientContext = createContext(null)

export function PatientProvider({ children }) {
  const [patient, setPatient] = useState(null)

  const clearPatient = useCallback(() => setPatient(null), [])

  const value = useMemo(() => ({ patient, setPatient, clearPatient }), [patient, clearPatient])

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
}
