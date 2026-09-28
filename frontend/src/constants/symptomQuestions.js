/**
 * The symptoms questionnaire.
 *
 * One definition, used for three things that must never drift apart:
 *   - the fields the form renders
 *   - the fields that must be answered before saving is allowed
 *   - the keys sent to POST /api/assessment/symptoms
 *
 * The `key` of each question is the field name in the stored document, and the
 * option labels are exactly the values the backend accepts. An option that does
 * not appear here would be rejected with a 422.
 *
 * These answers are **recorded, not interpreted**. There is no score, no weight
 * and no severity mapping anywhere in this file, and nothing here combines
 * answers into a conclusion about osteoarthritis.
 */

export const PAIN_SCALE_MIN = 0
export const PAIN_SCALE_MAX = 10

/** 0-10 pain scale, used by the one question that is a scale rather than a list. */
export const PAIN_SCALE = Array.from(
  { length: PAIN_SCALE_MAX - PAIN_SCALE_MIN + 1 },
  (_, index) => index + PAIN_SCALE_MIN,
)

export const PAIN_SCALE_LABELS = {
  0: 'No pain',
  5: 'Moderate',
  10: 'Worst possible',
}

const DIFFICULTY_OPTIONS = ['No difficulty', 'Mild', 'Moderate', 'Severe']
const FREQUENCY_OPTIONS = ['Never', 'Sometimes', 'Often']

export const SYMPTOM_QUESTIONS = [
  {
    key: 'knee',
    short: 'Knee',
    number: 1,
    section: 'Your knee',
    prompt: 'Which knee?',
    hint: 'Choose the knee the symptoms relate to.',
    options: ['Left', 'Right', 'Both'],
  },
  {
    key: 'pain_score',
    short: 'Pain score',
    number: 2,
    section: 'Your knee',
    prompt: 'How would you rate your knee pain?',
    hint: '0 is no pain, 10 is the worst pain you can imagine.',
    kind: 'scale',
  },
  {
    key: 'symptom_duration',
    short: 'Duration',
    number: 3,
    section: 'Your knee',
    prompt: 'How long have you had knee symptoms?',
    options: [
      'Less than 1 week',
      '1–4 weeks',
      '1–3 months',
      '3–6 months',
      'More than 6 months',
    ],
  },
  {
    key: 'stiffness',
    short: 'Stiffness',
    number: 4,
    section: 'Stiffness and swelling',
    prompt: 'Do you experience knee stiffness?',
    options: ['Never', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    key: 'stiffness_after_rest',
    short: 'Stiffness after rest',
    number: 5,
    section: 'Stiffness and swelling',
    prompt: 'Is the knee stiff after waking up or resting?',
    options: ['No', 'Yes, for a short time', 'Yes, for a longer time'],
  },
  {
    key: 'swelling',
    short: 'Swelling',
    number: 6,
    section: 'Stiffness and swelling',
    prompt: 'Do you experience knee swelling?',
    options: FREQUENCY_OPTIONS,
  },
  {
    key: 'walking_difficulty',
    short: 'Walking',
    number: 7,
    section: 'Movement',
    prompt: 'Do you have difficulty walking?',
    options: DIFFICULTY_OPTIONS,
  },
  {
    key: 'stairs_difficulty',
    short: 'Stairs',
    number: 8,
    section: 'Movement',
    prompt: 'Do you have difficulty climbing stairs?',
    options: DIFFICULTY_OPTIONS,
  },
  {
    key: 'chair_difficulty',
    short: 'Standing from chair',
    number: 9,
    section: 'Movement',
    prompt: 'Do you have difficulty standing up from a chair?',
    options: DIFFICULTY_OPTIONS,
  },
  {
    key: 'clicking_grinding',
    short: 'Clicking / grinding',
    number: 10,
    section: 'Other signs and history',
    prompt: 'Do you notice clicking/grinding in the knee?',
    options: FREQUENCY_OPTIONS,
  },
  {
    key: 'previous_injury_surgery',
    short: 'Previous injury / surgery',
    number: 11,
    section: 'Other signs and history',
    prompt: 'Have you had a previous knee injury or surgery?',
    options: ['No', 'Yes'],
  },
  {
    key: 'daily_activity_impact',
    short: 'Daily activity',
    number: 12,
    section: 'Other signs and history',
    prompt: 'Does knee pain affect your daily activities?',
    options: ['Not at all', 'Slightly', 'Moderately', 'Significantly'],
  },
]

/** Section headings in display order, derived so a new question needs one edit. */
export const SYMPTOM_SECTIONS = SYMPTOM_QUESTIONS.reduce((sections, question) => {
  const existing = sections.find((section) => section.name === question.section)

  if (existing) {
    existing.questions.push(question)
  } else {
    sections.push({ name: question.section, questions: [question] })
  }

  return sections
}, [])

/** Every field the backend requires, in questionnaire order. */
export const REQUIRED_SYMPTOM_KEYS = SYMPTOM_QUESTIONS.map((question) => question.key)

/** True when every question has an answer. Drives the Save button's disabled state. */
export function isQuestionnaireComplete(answers) {
  return REQUIRED_SYMPTOM_KEYS.every((key) => {
    const value = answers?.[key]

    if (typeof value === 'number') return Number.isInteger(value)

    return typeof value === 'string' && value.length > 0
  })
}

/** How many questions are answered, for the progress line. */
export function countAnswered(answers) {
  return REQUIRED_SYMPTOM_KEYS.filter((key) => {
    const value = answers?.[key]

    if (value === undefined || value === null || value === '') return false

    return true
  }).length
}

/**
 * One recorded answer, in the words the patient chose.
 *
 * The pain scale is stored as a number, so it is shown as the number plus the
 * scale's own wording. Nothing is added, ranked or interpreted: this only
 * formats what the backend already holds.
 */
export function formatSymptomAnswer(question, value) {
  if (value === undefined || value === null || value === '') return 'Not recorded'

  if (question.kind === 'scale') return `${value} out of 10`

  return String(value)
}
