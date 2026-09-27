/**
 * User-facing wording for one assessment result.
 *
 * Kept in one place because the same two headlines appear in three views: the
 * result card, the patient history list and the assessment report. They must not
 * drift apart.
 *
 * These are deliberately two-state. The model's severity class is a technical
 * label, not something shown as a headline, and nothing here is a diagnosis.
 */
export const RESULT_COPY = {
  healthyHeading: 'No OA-associated changes indicated',
  healthy: 'No significant OA pattern detected by the model.',
  indicatedHeading: 'OA-associated changes indicated',
  indicated: 'The model detected an OA-associated pattern in the X-ray.',
}

export const DISCLAIMER =
  'This is an AI-assisted preliminary assessment and is not a medical diagnosis.'

/** The headline for a stored result, from its OA indication flag. */
export function resultHeadline(oaIndication) {
  return oaIndication ? RESULT_COPY.indicatedHeading : RESULT_COPY.healthyHeading
}
