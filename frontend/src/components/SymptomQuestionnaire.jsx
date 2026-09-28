import { PAIN_SCALE, PAIN_SCALE_LABELS, SYMPTOM_SECTIONS } from '../constants/symptomQuestions'

/**
 * The symptoms questionnaire.
 *
 * Every question uses a real radio input, visually replaced by its own label, so
 * the form is keyboard navigable, announces correctly and works with assistive
 * technology. The stored answer is the option label itself, which is exactly
 * what the backend accepts.
 *
 * All questions are required, and the parent decides whether saving is allowed;
 * this component only reports what was answered.
 */
export default function SymptomQuestionnaire({ answers, onChange, disabled = false }) {
  const setAnswer = (key, value) => onChange({ ...answers, [key]: value })

  return (
    <div className="space-y-8">
      {SYMPTOM_SECTIONS.map((section) => (
        <section key={section.name} aria-labelledby={`section-${section.name.replace(/\s+/g, '-')}`}>
          <h2
            id={`section-${section.name.replace(/\s+/g, '-')}`}
            className="text-sm font-semibold tracking-wide text-sage-900 uppercase"
          >
            {section.name}
          </h2>

          <div className="mt-4 space-y-4">
            {section.questions.map((question) => {
              const selected = answers[question.key]

              return (
                <fieldset
                  key={question.key}
                  className="rounded-2xl border border-line bg-surface-warm px-5 py-5 shadow-card"
                  disabled={disabled}
                >
                  <legend className="sr-only">{question.prompt}</legend>

                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-plum-50 text-xs font-semibold text-plum-700"
                      aria-hidden="true"
                    >
                      {question.number}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-sage-900">
                        {question.prompt}
                        <span className="ml-1 text-error-700" aria-hidden="true">
                          *
                        </span>
                        <span className="sr-only"> (required)</span>
                      </p>
                      {question.hint ? (
                        <p className="mt-1 text-xs leading-relaxed text-ink-500">{question.hint}</p>
                      ) : null}
                    </div>
                  </div>

                  {question.kind === 'scale' ? (
                    <PainScale
                      name={question.key}
                      value={selected}
                      onSelect={(value) => setAnswer(question.key, value)}
                    />
                  ) : (
                    <OptionList
                      name={question.key}
                      options={question.options}
                      value={selected}
                      onSelect={(value) => setAnswer(question.key, value)}
                    />
                  )}
                </fieldset>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Shared option pill. The input is the source of truth; the span is the skin. */
function OptionPill({ type, name, value, checked, onChange, children }) {
  return (
    <label className="cursor-pointer">
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className="flex h-full items-center justify-center rounded-xl border border-line-strong bg-surface-warm px-3.5 py-2.5 text-center text-sm text-ink-700 transition-colors duration-200 hover:border-sage-400 hover:bg-sage-50 peer-checked:border-plum-500 peer-checked:bg-plum-50 peer-checked:font-medium peer-checked:text-plum-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-plum-700"
      >
        {children}
      </span>
    </label>
  )
}

function OptionList({ name, options, value, onSelect }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <OptionPill
          key={option}
          type="radio"
          name={name}
          value={option}
          checked={value === option}
          onChange={() => onSelect(option)}
        >
          {option}
        </OptionPill>
      ))}
    </div>
  )
}

/**
 * The 0-10 pain scale.
 *
 * Eleven numbers is too many for one row on a phone, so it wraps into a grid and
 * the three anchor labels sit underneath to make the ends meaningful.
 */
function PainScale({ name, value, onSelect }) {
  return (
    <div className="mt-4">
      <div
        role="radiogroup"
        aria-label="Knee pain on a 0 to 10 scale"
        className="grid grid-cols-6 gap-2 sm:grid-cols-11"
      >
        {PAIN_SCALE.map((score) => (
          <OptionPill
            key={score}
            type="radio"
            name={name}
            value={score}
            checked={value === score}
            onChange={() => onSelect(score)}
          >
            {score}
          </OptionPill>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
        <span>{PAIN_SCALE_LABELS[0]}</span>
        <span>{PAIN_SCALE_LABELS[5]}</span>
        <span>{PAIN_SCALE_LABELS[10]}</span>
      </div>
    </div>
  )
}
