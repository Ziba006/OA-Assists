import { useContext } from 'react'
import { PatientContext } from '../context/PatientContext'

/**
 * The patient currently being assessed.
 *
 * `patient` is null until a patient is selected and again after a page refresh,
 * so callers must handle the empty case.
 */
export function usePatient() {
  const context = useContext(PatientContext)

  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider')
  }

  return context
}

export default usePatient
