import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Cake,
  CircleSlash,
  ClipboardList,
  Footprints,
  Hash,
  Info,
  LayoutList,
  Plus,
  User,
  VenusAndMars,
} from 'lucide-react';

import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { buttonClasses } from '../components/ui/buttonStyles';
import { SYMPTOM_QUESTIONS } from '../constants/symptomQuestions';
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
  'text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-400';
const TILE_LABEL_CLASS =
  'text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-400';

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-surface-warm px-4 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-sage-500" aria-hidden="true" />
        <p className={TILE_LABEL_CLASS}>{label}</p>
      </div>
      <p className="mt-2 text-[0.95rem] font-medium text-ink-900">{value}</p>
    </div>
  );
}

/** The four patient facts, as compact tiles rather than a table. */
function PatientSummary({ patient }) {
  return (
    <section
      className="animate-fade-up mt-10"
      style={{ animationDelay: '40ms' }}
      aria-label="Patient summary"
    >
      <h2 className={SECTION_LABEL_CLASS}>Patient summary</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile icon={User} label="Patient name" value={patient.name} />
        <InfoTile icon={Hash} label="Patient ID" value={patient.patient_id} />
        <InfoTile
          icon={Cake}
          label="Age"
          value={
            patient.age === null || patient.age === undefined
              ? 'Not recorded'
              : `${patient.age}`
          }
        />
        <InfoTile
          icon={VenusAndMars}
          label="Sex"
          value={patient.gender || 'Not recorded'}
        />
      </div>
    </section>
  );
}

function SymptomTile({ label, value }) {
  return (
    <div className="rounded-xl border border-line/70 bg-surface-warm px-4 py-3.5">
      <p className={TILE_LABEL_CLASS}>{label}</p>
      <p className="mt-1.5 text-[0.95rem] leading-snug text-ink-900">{value}</p>
    </div>
  );
}

/** Every recorded answer, in a responsive grid of compact cards. */
function SymptomGrid({ symptoms, createdAt }) {
  return (
    <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SYMPTOM_QUESTIONS.map((question) => (
        <div key={question.key} className="contents">
          <dt className="sr-only">{question.prompt}</dt>
          <dd className="m-0">
            <SymptomTile label={question.short} value={symptoms[question.key]} />
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
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
          {title}
        </h2>
      </div>
      {meta ? <p className="text-xs text-ink-400">{meta}</p> : null}
    </div>
  );
}

/** The focal X-ray result: the headline outcome, then the supporting detail. */
function XrayResultCard({ xray, createdAt }) {
  const indicated = Boolean(xray.oa_indication);

  return (
    <section
      className="animate-fade-up mt-8"
      style={{ animationDelay: '80ms' }}
      aria-label="X-ray assessment"
    >
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-5 sm:px-8">
          <SectionHeading
            icon={Activity}
            title="X-Ray Assessment"
            meta={`Assessed ${formatAssessmentDate(createdAt)}`}
          />
        </div>

        <div
          className={
            indicated
              ? 'border-y border-plum-200/70 bg-plum-50 px-6 py-8 sm:px-8 sm:py-10'
              : 'border-y border-sage-200/70 bg-sage-50 px-6 py-8 sm:px-8 sm:py-10'
          }
        >
          <div className="flex items-start gap-4">
            <span
              className={
                indicated
                  ? 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-100 text-plum-600'
                  : 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-600'
              }
              aria-hidden="true"
            >
              <Activity className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className={TILE_LABEL_CLASS}>Preliminary result</p>
              <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-[1.75rem]">
                {resultHeadline(xray.oa_indication)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-6 py-6 sm:grid-cols-2 sm:px-8">
          <div className="rounded-2xl border border-line/70 bg-surface-warm px-5 py-4">
            <p className={TILE_LABEL_CLASS}>Model output class</p>
            <p className="mt-2 text-[0.95rem] font-medium text-ink-900">
              {indicated ? 'OA indicated' : 'No OA indicated'}
            </p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-surface-warm px-5 py-4">
            <p className={TILE_LABEL_CLASS}>Interpretation</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">
              {indicated
                ? 'The model detected patterns consistent with possible knee osteoarthritis in the uploaded radiograph. Symptoms should be reviewed together with the patient history.'
                : 'The model did not detect patterns consistent with knee osteoarthritis in the uploaded radiograph.'}
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

function XrayEmptyState() {
  return (
    <div className="border-y border-line/70 bg-surface-muted/60 px-6 py-8 sm:px-8">
      <p className="text-[0.95rem] font-medium text-ink-700">
        No X-ray assessment available
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
        This report has no X-ray findings. Complete an X-ray assessment to populate this
        section.
      </p>
    </div>
  );
}

function SymptomsCard({ symptoms, createdAt }) {
  return (
    <section
      className="animate-fade-up mt-8"
      style={{ animationDelay: '120ms' }}
      aria-label="Symptoms questionnaire"
    >
      <Card className="p-6 sm:p-8">
        <SectionHeading
          icon={ClipboardList}
          title="Symptom Questionnaire"
          meta={`Recorded ${formatAssessmentDate(createdAt)}`}
        />
        <SymptomGrid symptoms={symptoms} createdAt={createdAt} />
      </Card>
    </section>
  );
}

function SymptomsEmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line-strong bg-surface-muted/60 px-5 py-7">
      <p className="text-[0.95rem] font-medium text-ink-700">
        No symptom questionnaire recorded
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
        Complete the symptom questionnaire to populate this section.
      </p>
    </div>
  );
}

function ModuleCard({ icon: Icon, name, available, badge, note }) {
  return (
    <div
      className={
        available
          ? 'rounded-2xl border border-line/70 bg-surface-warm p-5'
          : 'rounded-2xl border border-dashed border-line-strong bg-surface-muted/60 p-5'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon
            className={available ? 'h-4 w-4 text-sage-600' : 'h-4 w-4 text-ink-400'}
            aria-hidden="true"
          />
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-700">
            {name}
          </span>
        </div>
        {badge}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-500">{note}</p>
    </div>
  );
}

function ImportantNote({ delay = '200ms' }) {
  return (
    <section
      className="animate-fade-up mt-8"
      style={{ animationDelay: delay }}
      aria-label="Important note"
    >
      <div className="flex gap-4 rounded-2xl border border-warning-500/30 bg-warning-100/50 px-6 py-6 sm:px-7">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning-700" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink-900">Important note</h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">{DISCLAIMER}</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-500">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
              <span>
                These results describe a screening analysis of the data entered for this
                patient. They are not a clinical evaluation.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
              <span>
                Always confirm these findings against a full clinical examination and
                qualified medical judgement.
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
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{message}</p>
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

  const latestXray = useMemo(
    () => assessmentState.items.find((item) => item.xray) ?? null,
    [assessmentState.items],
  );
  const latestSymptoms = useMemo(
    () => assessmentState.items.find((item) => item.symptoms) ?? null,
    [assessmentState.items],
  );

  if (!patient) return null;

  const handleNewAssessment = () => {
    navigate(ROUTES.xray, { state: { startNewXray: true } });
  };

  const handleBackToPatient = () => {
    navigate(ROUTES.xray);
  };

  /** Drop the assessment_id and show the combined report for this patient. */
  const handleViewFullReport = () => {
    navigate(ROUTES.report, { replace: true });
  };

  const handleRetry = () => setReloadToken((value) => value + 1);

  const reportDate = formatDateTime(new Date().toISOString());
  const identity = describePatient(patient);

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

    const assessment = singleState.assessment;
    const isXray = Boolean(assessment.xray);

    return (
      <div className="container-page max-w-[92rem] py-10 sm:py-14">
        <header className="animate-fade-up">
          <p className={SECTION_LABEL_CLASS}>Assessment module</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-[2.1rem]">
                  Assessment Report
                </h1>
                <Badge variant="warning">Preliminary</Badge>
              </div>
              <p className="mt-2.5 max-w-2xl text-[0.95rem] leading-relaxed text-ink-500">
                {isXray ? 'X-ray' : 'Symptom questionnaire'} assessment recorded for{' '}
                <span className="font-medium text-ink-700">{patient.name}</span> on{' '}
                <span className="font-medium text-ink-700">
                  {formatAssessmentDate(assessment.created_at)}
                </span>
                .
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-line/70 bg-surface-warm px-5 py-4 sm:text-right">
              <p className={TILE_LABEL_CLASS}>Report generated</p>
              <p className="mt-1.5 text-sm font-medium text-ink-900">{reportDate}</p>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-ink-500">
            {patient.patient_id} · {identity || 'No demographics recorded'}
          </p>
        </header>

        <PatientSummary patient={patient} />

        {isXray ? (
          <XrayResultCard xray={assessment.xray} createdAt={assessment.created_at} />
        ) : (
          <SymptomsCard
            symptoms={assessment.symptoms}
            createdAt={assessment.created_at}
          />
        )}

        <ImportantNote />

        <div
          className="animate-fade-up mt-10 flex flex-col items-stretch justify-between gap-3 border-t border-line/70 pt-8 sm:flex-row sm:items-center"
          style={{ animationDelay: '240ms' }}
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

  const xrayIndicated = Boolean(latestXray?.xray?.oa_indication);

  return (
    <div className="container-page max-w-[92rem] py-10 sm:py-14">
      {/* Report header */}
      <header className="animate-fade-up">
        <p className={SECTION_LABEL_CLASS}>Assessment module</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-[2.1rem]">
                Assessment Report
              </h1>
              <Badge variant="warning">Preliminary</Badge>
            </div>
            <p className="mt-2.5 max-w-2xl text-[0.95rem] leading-relaxed text-ink-500">
              Combined preliminary findings for{' '}
              <span className="font-medium text-ink-700">{patient.name}</span>, drawn from
              the most recent stored assessments for this patient.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-line/70 bg-surface-warm px-5 py-4 sm:text-right">
            <p className={TILE_LABEL_CLASS}>Report generated</p>
            <p className="mt-1.5 text-sm font-medium text-ink-900">{reportDate}</p>
          </div>
        </div>
        <p className="mt-5 text-sm font-medium text-ink-500">
          {patient.patient_id} · {identity || 'No demographics recorded'}
        </p>
      </header>

      <PatientSummary patient={patient} />

      {/* X-ray focal result */}
      <section
        className="animate-fade-up mt-8"
        style={{ animationDelay: '80ms' }}
        aria-label="X-ray assessment"
      >
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-5 sm:px-8">
            <SectionHeading
              icon={Activity}
              title="X-Ray Assessment"
              meta={
                latestXray ? `Assessed ${formatAssessmentDate(latestXray.created_at)}` : null
              }
            />
          </div>

          {latestXray ? (
            <>
              <div
                className={
                  xrayIndicated
                    ? 'border-y border-plum-200/70 bg-plum-50 px-6 py-8 sm:px-8 sm:py-10'
                    : 'border-y border-sage-200/70 bg-sage-50 px-6 py-8 sm:px-8 sm:py-10'
                }
              >
                <div className="flex items-start gap-4">
                  <span
                    className={
                      xrayIndicated
                        ? 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum-100 text-plum-600'
                        : 'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-600'
                    }
                    aria-hidden="true"
                  >
                    <Activity className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className={TILE_LABEL_CLASS}>Preliminary result</p>
                    <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-[1.75rem]">
                      {resultHeadline(latestXray.xray.oa_indication)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 px-6 py-6 sm:grid-cols-2 sm:px-8">
                <div className="rounded-2xl border border-line/70 bg-surface-warm px-5 py-4">
                  <p className={TILE_LABEL_CLASS}>Model output class</p>
                  <p className="mt-2 text-[0.95rem] font-medium text-ink-900">
                    {xrayIndicated ? 'OA indicated' : 'No OA indicated'}
                  </p>
                </div>
                <div className="rounded-2xl border border-line/70 bg-surface-warm px-5 py-4">
                  <p className={TILE_LABEL_CLASS}>Interpretation</p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">
                    {xrayIndicated
                      ? 'The model detected patterns consistent with possible knee osteoarthritis in the uploaded radiograph. Symptoms should be reviewed together with the patient history.'
                      : 'The model did not detect patterns consistent with knee osteoarthritis in the uploaded radiograph.'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <XrayEmptyState />
          )}
        </Card>
      </section>

      {/* Symptoms */}
      <section
        className="animate-fade-up mt-8"
        style={{ animationDelay: '120ms' }}
        aria-label="Symptoms questionnaire"
      >
        <Card className="p-6 sm:p-8">
          <SectionHeading
            icon={ClipboardList}
            title="Symptom Questionnaire"
            meta={
              latestSymptoms
                ? `Recorded ${formatAssessmentDate(latestSymptoms.created_at)}`
                : null
            }
          />
          {latestSymptoms ? (
            <SymptomGrid
              symptoms={latestSymptoms.symptoms}
              createdAt={latestSymptoms.created_at}
            />
          ) : (
            <SymptomsEmptyState />
          )}
        </Card>
      </section>

      {/* Assessment inputs */}
      <section
        className="animate-fade-up mt-8"
        style={{ animationDelay: '160ms' }}
        aria-label="Assessment inputs"
      >
        <h2 className={SECTION_LABEL_CLASS}>Assessment inputs</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          The modules that contributed to this report and the data each one contributed.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ModuleCard
            icon={Activity}
            name="X-Ray"
            available={Boolean(latestXray)}
            badge={
              latestXray ? (
                <Badge variant="success">Available</Badge>
              ) : (
                <Badge variant="neutral">Not available</Badge>
              )
            }
            note={
              latestXray
                ? `Radiograph assessment completed on ${formatAssessmentDate(
                    latestXray.created_at,
                  )}.`
                : 'No radiograph has been uploaded for this patient.'
            }
          />
          <ModuleCard
            icon={ClipboardList}
            name="Symptoms"
            available={Boolean(latestSymptoms)}
            badge={
              latestSymptoms ? (
                <Badge variant="success">Available</Badge>
              ) : (
                <Badge variant="neutral">Not available</Badge>
              )
            }
            note={
              latestSymptoms
                ? `Questionnaire completed on ${formatAssessmentDate(
                    latestSymptoms.created_at,
                  )}.`
                : 'No symptom questionnaire has been completed for this patient.'
            }
          />
          <ModuleCard
            icon={Footprints}
            name="Gait"
            available={false}
            badge={<Badge variant="neutral">Not available</Badge>}
            note="The gait module has not been implemented yet. It will be added later."
          />
        </div>
      </section>

      <ImportantNote />

      {/* Actions */}
      <div
        className="animate-fade-up mt-10 flex flex-col items-stretch justify-between gap-3 border-t border-line/70 pt-8 sm:flex-row sm:items-center"
        style={{ animationDelay: '240ms' }}
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
