import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleSlash,
  ClipboardList,
  Footprints,
  Info,
  LayoutList,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';

import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { buttonClasses } from '../components/ui/buttonStyles';
import {
  SYMPTOM_QUESTIONS,
  formatSymptomAnswer,
} from '../constants/symptomQuestions';
import { DISCLAIMER, resultHeadline } from '../constants/resultCopy';
import {
  describePatient,
  formatAssessmentDate,
  formatDateTime,
} from '../constants/format';
import { usePatient } from '../hooks/usePatient';
import { ApiError } from '../services/api';
import { getAssessment, listAssessments } from '../services/assessmentService';
import { ROUTES } from '../routes';

/** Turn a failed request into a short message the user can act on. */
function describeError(error) {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong while loading the assessment report. Please try again.';
  }

  if (error.status === 0) {
    return 'Cannot reach the OA Assist server. Make sure the backend is running, then try again.';
  }

  if (error.status === 401) {
    return 'Please sign in to view the assessment report.';
  }

  return error.message;
}

const SECTION_LABEL_CLASS =
  'text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-ink-400';
const TILE_LABEL_CLASS =
  'text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-400';

/** The one sentence shown when the gait module has no data for this patient. */
const GAIT_UNAVAILABLE_NOTE =
  'The gait module has not been implemented yet. It will be added later.';

const SYMPTOM_QUESTION_BY_KEY = SYMPTOM_QUESTIONS.reduce((byKey, question) => {
  byKey[question.key] = question;

  return byKey;
}, {});

/**
 * The symptom aspects worth naming in the summary, in the patient's own words.
 *
 * This is a presentation choice only: it picks which recorded answers to name,
 * and every line is the stored value formatted by the shared helper. Nothing is
 * scored, ranked, weighted or reworded, and the full set stays one click away in
 * the "Detailed Symptoms" section below.
 */
const HIGHLIGHTED_SYMPTOM_KEYS = [
  'stiffness',
  'stiffness_after_rest',
  'swelling',
  'walking_difficulty',
  'clicking_grinding',
  'daily_activity_impact',
];

/** The recorded answers named in the summary, skipping anything not recorded. */
function highlightedSymptoms(symptoms) {
  if (!symptoms) return [];

  return HIGHLIGHTED_SYMPTOM_KEYS.map((key) => {
    const question = SYMPTOM_QUESTION_BY_KEY[key];
    const value = formatSymptomAnswer(question, symptoms[key]);

    return { key, label: question.short, value };
  }).filter((entry) => entry.value !== 'Not recorded');
}

/** The newest of the dates actually available, for the report's date line. */
function latestDate(...values) {
  const dates = values.filter(Boolean).map((value) => new Date(value)).filter((date) => !Number.isNaN(date.getTime()))

  if (dates.length === 0) return null

  return dates.reduce((latest, date) => (date > latest ? date : latest)).toISOString();
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-surface-warm px-4 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
        <p className={TILE_LABEL_CLASS}>{label}</p>
      </div>
<p className="mt-2 text-base font-medium text-ink-900">{value}</p>
    </div>
  )
}

function SymptomTile({ label, value }) {
  return (
    <div className="rounded-xl border border-line/70 bg-surface-warm px-4 py-3.5">
      <p className={TILE_LABEL_CLASS}>{label}</p>
      <p className="mt-1.5 text-base leading-snug text-ink-900">{value}</p>
    </div>
  );
}

/** Every recorded answer, in a responsive grid of compact cards. */
function SymptomGrid({ symptoms, createdAt }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SYMPTOM_QUESTIONS.map((question) => (
        <div key={question.key} className="contents">
          <dt className="sr-only">{question.prompt}</dt>
          <dd className="m-0">
            <SymptomTile
              label={question.short}
              value={formatSymptomAnswer(question, symptoms[question.key])}
            />
          </dd>
        </div>
      ))}
      <div className="contents">
        <dt className="sr-only">Recorded</dt>
        <dd className="m-0">
          <SymptomTile label="Recorded" value={formatDateTime(createdAt)} />
        </dd>
      </div>
    </dl>
  );
}

function SectionHeading({ icon: Icon, title, meta }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-sage-600" aria-hidden="true" />
        <h2 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
          {title}
        </h2>
      </div>
      {meta ? <p className="text-xs text-ink-400">{meta}</p> : null}
    </div>
  );
}

/**
 * A disclosure for the underlying data.
 *
 * A real button with aria-expanded rather than a styled div, so the detail is
 * reachable by keyboard and announced correctly. The detailed data is rendered
 * only once the user asks for it, which is what lets the summary lead the report
 * without hiding anything.
 */
function Disclosure({ icon: Icon, title, meta, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-line/70 bg-surface-warm">
      <h3>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors duration-200 hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-500"
        >
          <span className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 text-sage-600" aria-hidden="true" />
            <span className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
              {title}
            </span>
          </span>

          <span className="flex items-center gap-3">
            {meta ? <span className="text-xs text-ink-400">{meta}</span> : null}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-sage-600 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </button>
      </h3>

      {isOpen ? <div className="border-t border-line/70 px-5 py-5">{children}</div> : null}
    </div>
  );
}

/**
 * The report header: who this is about, and what the report covers.
 *
 * The date shown is the newest assessment actually behind the report, not the
 * moment the page was opened, so the header always describes the data on screen.
 */
function ReportHeader({ patient, assessmentDate, isSingle, generatedAt }) {
  const identity = describePatient(patient);

  return (
    <header className="animate-fade-up">
      <p className={SECTION_LABEL_CLASS}>Assessment report</p>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-[2.1rem]">
              Assessment Report
            </h1>
            <Badge tone="warning">Preliminary</Badge>
          </div>

          <p className="mt-2.5 max-w-2xl text-base leading-relaxed text-ink-500">
            <span className="font-medium text-ink-700">Patient:</span> {patient.name} ·{' '}
            <span className="font-medium text-ink-700">{patient.patient_id}</span>
            {identity ? ` · ${identity}` : ''}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-line/70 bg-surface-warm px-5 py-4 sm:text-right">
          <p className={TILE_LABEL_CLASS}>Report generated</p>
          <p className="mt-1.5 text-sm font-medium text-ink-900">{generatedAt}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile icon={User} label="Patient name" value={patient.name} />
        <InfoTile
          icon={Activity}
          label="Age"
          value={patient.age === null || patient.age === undefined ? 'Not recorded' : `${patient.age}`}
        />
        <InfoTile icon={Stethoscope} label="Gender" value={patient.gender || 'Not recorded'} />
        <InfoTile
          icon={ClipboardList}
          label="Assessment date"
          value={assessmentDate ? formatAssessmentDate(assessmentDate) : 'No assessment recorded'}
        />
      </div>

      <p className="mt-4 text-sm text-ink-500">
        {isSingle
          ? 'This report covers one saved assessment.'
          : 'This report combines the most recent stored assessments for this patient.'}
      </p>
    </header>
  );
}

/**
 * The integrated summary: what the available inputs reported, in one paragraph.
 *
 * This is the focal point of the report, so it leads with what each input said
 * rather than with a conclusion. The wording is fixed to the inputs that exist
 * and never asserts the presence or absence of osteoarthritis, and it never
 * combines the inputs into a score, a likelihood or a risk band.
 */
function buildIntegratedSummary({ xray, symptoms, gait }) {
  const parts = [];

  if (xray) {
    parts.push(
      xray.oa_indication
        ? 'The X-ray AI model indicated an OA-associated pattern in the submitted radiograph.'
        : 'The X-ray AI model did not indicate an OA-associated pattern in the submitted radiograph.',
    );
  }

  if (symptoms) {
    parts.push(
      'A symptom questionnaire was also completed, and the responses the patient recorded are summarised below.',
    );
  }

  if (gait) {
    parts.push('A gait assessment is included and reported separately below.');
  }

  if (parts.length === 0) {
    return 'No assessment data has been recorded for this patient yet, so there is nothing to summarise. Complete an X-ray or symptom assessment to generate this report.';
  }

  return `${parts.join(' ')} These findings are reported side by side so they can be read together. They are not combined into a score or a diagnosis, and a qualified healthcare professional is the right person to interpret them.`;
}

/**
 * The relationship between the findings.
 *
 * Each branch describes only the inputs that exist. Where imaging and symptoms
 * disagree, that is stated as something the two inputs can legitimately do, and
 * the text always points back to clinical evaluation rather than to a
 * conclusion about the patient.
 */
function buildInterpretation({ xray, symptoms, gait, isSingle }) {
  if (xray && symptoms) {
    const lead = xray.oa_indication
      ? 'The X-ray AI model indicated an OA-associated pattern, and the patient also reported knee symptoms.'
      : 'The X-ray AI model did not indicate an OA-associated pattern, while the patient reported knee symptoms.';

    return `${lead} Imaging findings and reported symptoms do not always correspond, so a finding on one and not the other is not unusual. These findings provide additional context and should be considered in the context of a clinical evaluation.`;
  }

  if (xray) {
    return isSingle
      ? 'The current report is based on the available X-ray assessment.'
      : 'The current report is based on the available X-ray assessment. No symptom questionnaire has been recorded for this patient, so the report reflects the imaging result alone.';
  }

  if (symptoms) {
    return isSingle
      ? 'The current report is based on reported symptoms; symptoms alone do not establish a diagnosis.'
      : 'The current report is based on reported symptoms; symptoms alone do not establish a diagnosis. No X-ray assessment has been recorded for this patient, so there is no imaging finding to read alongside them.';
  }

  if (gait) {
    return 'The current report is based on the available gait assessment.';
  }

  return 'There are no stored assessments for this patient, so this report cannot summarise any findings yet.';
}

function IntegratedSummaryCard({ summary }) {
  return (
    <section className="animate-fade-up mt-8" style={{ animationDelay: '60ms' }}>
      <Card className="overflow-hidden border-plum-200/70 p-0">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-plum-200/70 bg-plum-50 px-6 py-4 sm:px-8">
          <Sparkles className="h-4 w-4 text-plum-600" aria-hidden="true" />
          <h2 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-plum-700">
            Integrated Preliminary Assessment
          </h2>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <p className="text-[1.15rem] leading-relaxed text-ink-700">{summary}</p>
        </div>
      </Card>
    </section>
  );
}

/** The X-ray key finding: the headline outcome plus the stored interpretation. */
function XrayKeyCard({ xray, createdAt }) {
  const indicated = Boolean(xray.oa_indication);

  return (
    <Card
      className={`h-full p-5 ${indicated ? 'border-plum-200/70' : 'border-line/70'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-sage-600" aria-hidden="true" />
          <h3 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
            X-Ray
          </h3>
        </div>
        <span
          className={
            indicated
              ? 'flex h-7 w-7 items-center justify-center rounded-full bg-plum-100 text-plum-600'
              : 'flex h-7 w-7 items-center justify-center rounded-full bg-sage-100 text-sage-600'
          }
          aria-hidden="true"
        >
          {indicated ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </span>
      </div>

      {/*
          The headline is the finding the reader came for, so it is the largest
          text in the card and sits in its own tinted panel, with the model's own
          interpretation below it at supporting size. The accent follows the
          result -- plum for an OA-associated pattern, sage for none indicated --
          and is a tint only: nothing here adds a score, a probability or a
          diagnosis to the model's stored output.
        */}
      <div
        className={`mt-4 rounded-xl border px-4 py-4 ${
          indicated ? 'border-plum-300 bg-plum-50' : 'border-sage-300 bg-sage-50'
        }`}
      >
        <p className="text-[1.6rem] font-bold leading-[1.15] tracking-tight text-sage-900">
          {resultHeadline(xray.oa_indication)}
        </p>
      </div>

      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-500">
        {xray.interpretation ||
          (indicated
            ? 'The model indicated an OA-associated pattern in the submitted X-ray.'
            : 'The model did not indicate an OA-associated pattern in the submitted X-ray.')}
      </p>

      <p className="mt-3 text-xs text-ink-400">Assessed {formatAssessmentDate(createdAt)}</p>
    </Card>
  );
}

/** The symptom key finding: the headline numbers, then the named responses. */
function SymptomsKeyCard({ symptoms, createdAt }) {
  const named = highlightedSymptoms(symptoms);

  return (
    <Card className="h-full p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="h-4 w-4 text-sage-600" aria-hidden="true" />
          <h3 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
            Symptoms
          </h3>
        </div>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-sage-100 text-sage-600"
          aria-hidden="true"
        >
          <Check className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className={TILE_LABEL_CLASS}>Pain</p>
          <p className="mt-1 text-[1.35rem] font-semibold leading-none text-ink-900">
            {typeof symptoms.pain_score === 'number' ? `${symptoms.pain_score}` : '—'}
            <span className="ml-1 text-sm font-normal text-ink-500">/ 10</span>
          </p>
        </div>
        <div>
          <p className={TILE_LABEL_CLASS}>Knee</p>
          <p className="mt-1 text-[1.35rem] font-semibold leading-none text-ink-900">
            {symptoms.knee || '—'}
          </p>
        </div>
      </div>

      {named.length > 0 ? (
        <>
          <p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Symptoms reported
          </p>
          <ul className="mt-2 space-y-1.5">
            {named.map((entry) => (
              <li key={entry.key} className="flex gap-2 text-[0.95rem] leading-relaxed text-ink-700">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sage-500" aria-hidden="true" />
                <span>
                  <span className="text-ink-500">{entry.label}:</span> {entry.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-3 text-xs text-ink-400">Recorded {formatAssessmentDate(createdAt)}</p>
    </Card>
  );
}

/**
 * The gait key finding.
 *
 * The gait module is not implemented, so `gait` is only ever set if a real
 * assessment document carries one. With no data it states that plainly and does
 * not imply the patient needs one.
 */
function GaitKeyCard({ gait, createdAt }) {
  return (
    <Card className="h-full border-dashed p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Footprints className="h-4 w-4 text-ink-400" aria-hidden="true" />
          <h3 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
            Gait
          </h3>
        </div>
        <Badge tone="neutral">{gait ? 'Available' : 'Not available'}</Badge>
      </div>

      <p className="mt-4 text-xl font-semibold leading-snug tracking-tight text-ink-900">
        {gait?.result_headline ?? 'No gait assessment recorded'}
      </p>

      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">
        {gait?.interpretation ?? GAIT_UNAVAILABLE_NOTE}
      </p>

      {gait && createdAt ? (
        <p className="mt-3 text-xs text-ink-400">Assessed {formatAssessmentDate(createdAt)}</p>
      ) : null}
    </Card>
  );
}

/**
 * The key findings: one compact card per assessment input.
 *
 * `scope` is the set of inputs that belong to the report being shown. A
 * combined report covers X-ray and Symptoms, so it shows a card for each even
 * when one is missing. A report for one specific assessment covers only that
 * assessment, so it shows only that card: an X-ray that exists for the patient
 * but is not part of this report must not be described as "not recorded".
 */
function KeyFindings({ xray, symptoms, gait, xrayDate, symptomsDate, gaitDate, scope }) {
  const shows = (name) => scope.includes(name);

  return (
    <section className="animate-fade-up mt-10" style={{ animationDelay: '100ms' }} aria-label="Key findings">
      <SectionHeading icon={Sparkles} title="Key findings" />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {shows('xray') ? (
          xray ? (
            <XrayKeyCard xray={xray} createdAt={xrayDate} />
          ) : (
            <Card className="h-full border-dashed p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Activity className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  <h3 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
                    X-Ray
                  </h3>
                </div>
                <Badge tone="neutral">Not available</Badge>
              </div>
              <p className="mt-4 text-xl font-semibold leading-snug tracking-tight text-ink-900">
                No X-ray assessment recorded
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">
                No radiograph has been assessed for this patient, so there is no imaging finding in
                this report.
              </p>
            </Card>
          )
        ) : null}

        {shows('symptoms') ? (
          symptoms ? (
            <SymptomsKeyCard symptoms={symptoms} createdAt={symptomsDate} />
          ) : (
            <Card className="h-full border-dashed p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  <h3 className="text-[0.85rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
                    Symptoms
                  </h3>
                </div>
                <Badge tone="neutral">Not available</Badge>
              </div>
              <p className="mt-4 text-xl font-semibold leading-snug tracking-tight text-ink-900">
                No symptoms recorded
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">
                No symptom questionnaire has been completed for this patient, so there are no
                reported responses in this report.
              </p>
            </Card>
          )
        ) : null}

        {shows('gait') ? <GaitKeyCard gait={gait} createdAt={gaitDate} /> : null}
      </div>
    </section>
  );
}

/** The model output exactly as stored, for transparency under the summary. */
function XrayDetails({ xray, createdAt }) {
  const probabilities = Object.entries(xray.probabilities ?? {});

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line/70 bg-surface-muted/60 px-5 py-4">
          <p className={TILE_LABEL_CLASS}>Model output class</p>
          <p className="mt-2 text-base font-medium text-ink-900">
            {xray.predicted_class || 'Not recorded'}
          </p>
        </div>
        <div className="rounded-2xl border border-line/70 bg-surface-muted/60 px-5 py-4">
          <p className={TILE_LABEL_CLASS}>Model confidence</p>
          <p className="mt-2 text-base font-medium text-ink-900">
            {typeof xray.confidence === 'number' ? xray.confidence.toFixed(2) : 'Not recorded'}
          </p>
        </div>
      </div>

      {probabilities.length > 0 ? (
        <div>
          <p className={TILE_LABEL_CLASS}>Class probabilities from the model</p>
          <dl className="mt-2.5 space-y-2">
            {probabilities.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 text-[0.95rem]">
                <dt className="text-ink-700">{label}</dt>
                <dd className="font-medium text-ink-900">
                  {typeof value === 'number' ? value.toFixed(4) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div>
        <p className={TILE_LABEL_CLASS}>Interpretation</p>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">
          {xray.interpretation || 'Not recorded'}
        </p>
      </div>

      {xray.note ? (
        <div>
          <p className={TILE_LABEL_CLASS}>Model note</p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">{xray.note}</p>
        </div>
      ) : null}

      <p className="text-xs text-ink-400">Assessed {formatDateTime(createdAt)}</p>
    </div>
  );
}

/** Every stored questionnaire response, unchanged. */
function SymptomDetails({ symptoms, createdAt }) {
  return (
    <div>
      <SymptomGrid symptoms={symptoms} createdAt={createdAt} />
      <p className="mt-4 text-xs leading-relaxed text-ink-400">
        These are the responses the patient recorded. They are stored as entered and are not
        scored or interpreted.
      </p>
    </div>
  );
}

/**
 * The detailed data, below the summary.
 *
 * Nothing is removed here: the same X-ray result and the same twelve symptom
 * answers that used to fill the report are all here, one click away.
 */
function DetailedData({ xray, symptoms, gait, xrayDate, symptomsDate, gaitDate }) {
  if (!xray && !symptoms && !gait) return null;

  return (
    <section className="animate-fade-up mt-10" style={{ animationDelay: '160ms' }} aria-label="Detailed data">
      <SectionHeading
        icon={LayoutList}
        title="Detailed data"
        meta="The stored values behind the findings above"
      />

      <div className="mt-4 space-y-3">
        {xray ? (
          <Disclosure
            icon={Activity}
            title="X-Ray Details"
            meta={formatAssessmentDate(xrayDate)}
          >
            <XrayDetails xray={xray} createdAt={xrayDate} />
          </Disclosure>
        ) : null}

        {symptoms ? (
          <Disclosure
            icon={ClipboardList}
            title="Detailed Symptoms"
            meta={formatAssessmentDate(symptomsDate)}
          >
            <SymptomDetails symptoms={symptoms} createdAt={symptomsDate} />
          </Disclosure>
        ) : null}

        {gait ? (
          <Disclosure icon={Footprints} title="Gait Details" meta={formatAssessmentDate(gaitDate)}>
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(gait).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-line/70 bg-surface-muted/60 px-4 py-3">
                  <dt className={TILE_LABEL_CLASS}>{key.replace(/_/g, ' ')}</dt>
                  <dd className="mt-1.5 text-sm text-ink-900">
                    {typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        ) : null}
      </div>
    </section>
  );
}

/**
 * What to do next.
 *
 * With symptoms recorded it says to raise them with a professional. With none
 * recorded it offers to record them, and it never suggests a gait assessment,
 * because the module does not exist.
 */
function NextSteps({ hasSymptoms, onAddSymptoms }) {
  return (
    <section className="animate-fade-up mt-8" style={{ animationDelay: '200ms' }} aria-label="Next steps">
      <SectionHeading icon={Stethoscope} title="Next steps" />

      <div className="mt-4 rounded-2xl border border-plum-200/70 bg-plum-50/40 px-5 py-5 sm:px-6">
        <p className="text-base leading-relaxed text-ink-700">
          {hasSymptoms
            ? 'If symptoms persist, worsen, or interfere with daily activities, consider discussing them with a qualified healthcare professional.'
            : 'No symptoms have been recorded for this patient. Recording them alongside the X-ray result gives a clinician more context to work from.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {hasSymptoms ? (
            <>
              <Link
                to={ROUTES.guidance}
                className={buttonClasses({ variant: 'primary' })}
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                Care &amp; Guidance
              </Link>
              <Link
                to={ROUTES.nearbyDoctors}
                className={buttonClasses({ variant: 'secondary' })}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Find Nearby Doctors
              </Link>
            </>
          ) : (
            <button type="button" onClick={onAddSymptoms} className={buttonClasses({ variant: 'primary' })}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Symptoms
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ImportantNote({ delay = '240ms' }) {
  return (
    <section className="animate-fade-up mt-8" style={{ animationDelay: delay }} aria-label="Important note">
      <div className="flex gap-4 rounded-2xl border border-warning-500/30 bg-warning-100/50 px-6 py-6 sm:px-7">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink-900">Important note</h2>
          <p className="mt-2 text-base leading-relaxed text-ink-700">{DISCLAIMER}</p>

          <ul className="mt-4 space-y-2 text-[0.95rem] leading-relaxed text-ink-500">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
              <span>X-ray findings are generated by an AI model from the submitted image.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
              <span>Symptoms are based on patient-reported responses to the questionnaire.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
              <span>
                Gait findings, when available, are based on gait analysis recorded by the gait
                module.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
              <span>
                Results should be discussed with a qualified healthcare professional when
                appropriate.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="container-page max-w-[92rem] py-14">
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span
          className="h-9 w-9 animate-spin rounded-full border-2 border-sage-200 border-t-sage-600"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-ink-700">Loading assessment report</p>
        {message ? <p className="text-sm text-ink-500">{message}</p> : null}
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry, onBack }) {
  return (
    <div className="container-page max-w-[92rem] py-14">
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <CircleSlash className="mx-auto h-9 w-9 text-error-500" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold text-ink-900">
          We could not load this report
        </h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{message}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={buttonClasses({ variant: 'primary' })}
            >
              Try again
            </button>
          ) : null}
          <button
            type="button"
            onClick={onBack}
            className={buttonClasses({ variant: 'secondary' })}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Patient
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function Report() {
  const { patient } = usePatient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // The report page has two modes, and which one applies is decided entirely by
  // the query string. With `assessment_id` the page reports on that one saved
  // assessment; without it, the page reports on the patient's latest X-ray and
  // latest symptoms. The id is resolved by the backend against the signed-in
  // user, so it is never trusted on the client.
  const assessmentId = searchParams.get('assessment_id');
  const isSingleAssessment = Boolean(assessmentId);

  const [assessmentState, setAssessmentState] = useState({
    status: 'loading',
    items: [],
    error: null,
  });
  const [singleState, setSingleState] = useState({
    status: 'loading',
    assessment: null,
    reason: null,
    error: null,
  });
  const [reloadToken, setReloadToken] = useState(0);

  // Mode A: the patient's whole history, newest first.
  useEffect(() => {
    if (!patient || isSingleAssessment) return undefined;

    const controller = new AbortController();
    const requestKey = `${patient.patient_id}:${reloadToken}`;
    let active = true;

    setAssessmentState((prev) =>
      prev.requestKey === requestKey
        ? prev
        : { status: 'loading', items: [], error: null, requestKey },
    );

    listAssessments(patient.patient_id, { signal: controller.signal })
      .then((items) => {
        if (!active) return;
        setAssessmentState({ status: 'success', items, error: null, requestKey });
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return;
        setAssessmentState({
          status: 'error',
          items: [],
          error: describeError(error),
          requestKey,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [patient, isSingleAssessment, reloadToken]);

  // Mode B: one assessment, fetched by id. The backend already refuses to return
  // an assessment owned by somebody else; the patient check below is the second
  // half, so an assessment from another patient can never be shown against the
  // selected patient either.
  useEffect(() => {
    if (!patient || !assessmentId) return undefined;

    const controller = new AbortController();
    const requestKey = `${assessmentId}:${reloadToken}`;
    let active = true;

    setSingleState((prev) =>
      prev.requestKey === requestKey
        ? prev
        : { status: 'loading', assessment: null, reason: null, error: null, requestKey },
    );

    getAssessment(assessmentId, { signal: controller.signal })
      .then((assessment) => {
        if (!active) return;

        if (!assessment) {
          setSingleState({
            status: 'error',
            assessment: null,
            reason: 'missing',
            error: 'That assessment no longer exists. It may have been deleted.',
            requestKey,
          });
          return;
        }

        if (assessment.patient_id !== patient.patient_id) {
          setSingleState({
            status: 'error',
            assessment: null,
            reason: 'other-patient',
            error: 'That assessment belongs to a different patient.',
            requestKey,
          });
          return;
        }

        setSingleState({ status: 'success', assessment, reason: null, error: null, requestKey });
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return;
        setSingleState({
          status: 'error',
          assessment: null,
          reason: 'failed',
          error: describeError(error),
          requestKey,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [patient, assessmentId, reloadToken]);

  // `gait` is only ever set if a stored assessment actually carries gait data.
  // The module is not implemented, so in practice this stays null and the report
  // says so rather than showing an invented finding.
  const combined = useMemo(() => {
    if (isSingleAssessment) return null;

    const items = assessmentState.items;
    const xray = items.find((item) => item.xray) ?? null;
    const symptoms = items.find((item) => item.symptoms) ?? null;
    const gait = items.find((item) => item.gait) ?? null;

    return {
      xray: xray?.xray ?? null,
      xrayDate: xray?.created_at ?? null,
      symptoms: symptoms?.symptoms ?? null,
      symptomsDate: symptoms?.created_at ?? null,
      gait: gait?.gait ?? null,
      gaitDate: gait?.created_at ?? null,
    };
  }, [assessmentState.items, isSingleAssessment]);

  const single = useMemo(() => {
    if (!isSingleAssessment || singleState.assessment === null) return null;

    const assessment = singleState.assessment;

    return {
      xray: assessment.xray ?? null,
      xrayDate: assessment.created_at ?? null,
      symptoms: assessment.symptoms ?? null,
      symptomsDate: assessment.created_at ?? null,
      gait: assessment.gait ?? null,
      gaitDate: assessment.created_at ?? null,
    };
  }, [isSingleAssessment, singleState.assessment]);

  if (!patient) return null;

  const handleNewAssessment = () => {
    navigate(ROUTES.xray, { state: { startNewXray: true } });
  };

  const handleBackToPatient = () => {
    navigate(ROUTES.xray);
  };

  /** Add symptoms, which needs a patient bound to the questionnaire. */
  const handleAddSymptoms = () => {
    if (combined?.symptoms) {
      navigate(ROUTES.symptoms);
      return;
    }

    navigate(ROUTES.xray, { state: { startNewXray: true } });
  };

  /** Drop the assessment_id and show the combined report for this patient. */
  const handleViewFullReport = () => {
    navigate(ROUTES.report, { replace: true });
  };

  const handleRetry = () => setReloadToken((value) => value + 1);

  const generatedAt = formatDateTime(new Date().toISOString());

  // ---- Mode B: one specific assessment ---------------------------------
  if (isSingleAssessment) {
    if (singleState.status === 'loading') {
      return (
        <LoadingScreen message={`Retrieving assessment ${assessmentId} for ${patient.name}.`} />
      );
    }

    if (singleState.status === 'error') {
      return (
        <ErrorScreen message={singleState.error} onRetry={handleRetry} onBack={handleBackToPatient} />
      );
    }

    const inputs = single ?? {
      xray: null,
      xrayDate: null,
      symptoms: null,
      symptomsDate: null,
      gait: null,
      gaitDate: null,
    };
    const assessmentDate = latestDate(inputs.xrayDate, inputs.symptomsDate, inputs.gaitDate);

    return (
      <div className="container-page max-w-[92rem] py-10 sm:py-14">
        <ReportHeader
          patient={patient}
          assessmentDate={assessmentDate}
          isSingle
          generatedAt={generatedAt}
        />

        <IntegratedSummaryCard
          summary={buildIntegratedSummary({
            xray: inputs.xray,
            symptoms: inputs.symptoms,
            gait: inputs.gait,
          })}
        />

        <KeyFindings
          xray={inputs.xray}
          symptoms={inputs.symptoms}
          gait={inputs.gait}
          xrayDate={inputs.xrayDate}
          symptomsDate={inputs.symptomsDate}
          gaitDate={inputs.gaitDate}
          scope={[
            inputs.xray ? 'xray' : null,
            inputs.symptoms ? 'symptoms' : null,
            'gait',
          ].filter(Boolean)}
        />

        <section
          className="animate-fade-up mt-10"
          style={{ animationDelay: '140ms' }}
          aria-label="Integrated interpretation"
        >
          <SectionHeading icon={Info} title="Integrated interpretation" />
          <Card className="mt-4 p-6 sm:p-7">
            <p className="text-[1.05rem] leading-relaxed text-ink-700">
              {buildInterpretation({
                xray: inputs.xray,
                symptoms: inputs.symptoms,
                gait: inputs.gait,
              })}
            </p>
          </Card>
        </section>

        <DetailedData
          xray={inputs.xray}
          symptoms={inputs.symptoms}
          gait={inputs.gait}
          xrayDate={inputs.xrayDate}
          symptomsDate={inputs.symptomsDate}
          gaitDate={inputs.gaitDate}
        />

        <ImportantNote />

        <div
          className="animate-fade-up mt-10 flex flex-col items-stretch justify-between gap-3 border-t border-line/70 pt-8 sm:flex-row sm:items-center"
          style={{ animationDelay: '280ms' }}
        >
          <button
            type="button"
            onClick={handleBackToPatient}
            className={buttonClasses({ variant: 'secondary' })}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Patient
          </button>
          <button
            type="button"
            onClick={handleViewFullReport}
            className={buttonClasses({ variant: 'primary' })}
          >
            <LayoutList className="h-4 w-4" aria-hidden="true" />
            View Full Report
          </button>
        </div>
      </div>
    );
  }

  // ---- Mode A: the combined patient report ------------------------------
  if (assessmentState.status === 'loading') {
    return (
      <LoadingScreen message={`Retrieving the latest records for ${patient.name}.`} />
    );
  }

  if (assessmentState.status === 'error') {
    return (
      <ErrorScreen message={assessmentState.error} onRetry={handleRetry} onBack={handleBackToPatient} />
    );
  }

  const inputs = combined ?? {
    xray: null,
    xrayDate: null,
    symptoms: null,
    symptomsDate: null,
    gait: null,
    gaitDate: null,
  };
  const assessmentDate = latestDate(inputs.xrayDate, inputs.symptomsDate, inputs.gaitDate);

  return (
    <div className="container-page max-w-[92rem] py-10 sm:py-14">
      <ReportHeader
        patient={patient}
        assessmentDate={assessmentDate}
        isSingle={false}
        generatedAt={generatedAt}
      />

      <IntegratedSummaryCard
        summary={buildIntegratedSummary({
          xray: inputs.xray,
          symptoms: inputs.symptoms,
          gait: inputs.gait,
        })}
      />

      <KeyFindings
        xray={inputs.xray}
        symptoms={inputs.symptoms}
        gait={inputs.gait}
        xrayDate={inputs.xrayDate}
        symptomsDate={inputs.symptomsDate}
        gaitDate={inputs.gaitDate}
        scope={['xray', 'symptoms', 'gait']}
      />

      <section
        className="animate-fade-up mt-10"
        style={{ animationDelay: '140ms' }}
        aria-label="Integrated interpretation"
      >
        <SectionHeading icon={Info} title="Integrated interpretation" />
        <Card className="mt-4 p-6 sm:p-7">
          <p className="text-[1.05rem] leading-relaxed text-ink-700">
            {buildInterpretation({
              xray: inputs.xray,
              symptoms: inputs.symptoms,
              gait: inputs.gait,
              isSingle: true,
            })}
          </p>
        </Card>
      </section>

      <DetailedData
        xray={inputs.xray}
        symptoms={inputs.symptoms}
        gait={inputs.gait}
        xrayDate={inputs.xrayDate}
        symptomsDate={inputs.symptomsDate}
        gaitDate={inputs.gaitDate}
      />

      <NextSteps hasSymptoms={Boolean(inputs.symptoms)} onAddSymptoms={handleAddSymptoms} />

      <ImportantNote />

      <div
        className="animate-fade-up mt-10 flex flex-col items-stretch justify-between gap-3 border-t border-line/70 pt-8 sm:flex-row sm:items-center"
        style={{ animationDelay: '280ms' }}
      >
        <button
          type="button"
          onClick={handleBackToPatient}
          className={buttonClasses({ variant: 'secondary' })}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Patient
        </button>
        <button
          type="button"
          onClick={handleNewAssessment}
          className={buttonClasses({ variant: 'primary' })}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Assessment
        </button>
      </div>
    </div>
  );
}
