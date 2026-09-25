import { createContext, useCallback, useMemo, useState } from 'react'

const emptyDrafts = { xray: null, gait: null, symptoms: null, report: null }

/**
 * Holds assessment input for the current session only.
 *
 * Nothing is written to localStorage or a database, so guest data disappears
 * when the session ends. Once the API exists, drafts are submitted to the
 * relevant service and cleared from this state.
 */
export const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const [drafts, setDrafts] = useState(emptyDrafts)

  const setDraft = useCallback((module, data) => {
    setDrafts((current) => ({ ...current, [module]: data }))
  }, [])

  const clearDraft = useCallback((module) => {
    setDrafts((current) => ({ ...current, [module]: null }))
  }, [])

  const resetAssessments = useCallback(() => {
    setDrafts(emptyDrafts)
  }, [])

  const value = useMemo(
    () => ({ drafts, setDraft, clearDraft, resetAssessments }),
    [drafts, setDraft, clearDraft, resetAssessments],
  )

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}
