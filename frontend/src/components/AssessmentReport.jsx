import { ArrowLeft, FileText } from 'lucide-react'
import Card from './ui/Card'
import Badge from './ui/Badge'
import { buttonClasses } from './ui/buttonStyles'
import { DISCLAIMER, resultHeadline } from '../constants/resultCopy'
import { describePatient, formatDateTime } from '../constants/format'

const TYPE_LABELS = {
  xray: 'X-Ray Assessment',
  symptoms: 'Symptoms Assessment',
  gait: 'Gait Assessment',
}

/** Label/value row used for the plain details. */
function DetailRow({ label, children }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-xs font-medium tracking-wide text-ink-400 uppercase">{label}</dt>
      <dd className="text-sm text-sage-900">{children}</dd>
    </div>
  )
}

/**
 * Assessment report.
 *
 * A plain detail view of one saved assessment, showing exactly what the API
 * returned. This is deliberately not a report yet: there are no treatment
 * recommendations, no symptom or gait findings, and nothing is inferred beyond
 * the stored result.
 */
export default function AssessmentReport({ assessment, patient, onBack }) {
  if (!assessment) return null

  const xray = assessment.xray

  return (
    <Card className="p-6 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className={buttonClasses({ variant: 'ghost', size: 'sm', className: '-ml-2' })}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to history
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
            Assessment Report
          </p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-sage-900 sm:text-2xl">
            {TYPE_LABELS[assessment.type] ?? 'Assessment'}
          </h2>
        </div>

        <Badge tone="warning" dot>
          Preliminary
        </Badge>
      </div>

      <dl className="mt-6 rounded-2xl border border-line bg-surface-muted px-4 py-1">
        <DetailRow label="Patient">
          {patient ? `${patient.name} · ${patient.patient_id}` : assessment.patient_id}
        </DetailRow>
        <DetailRow label="Patient ID">{assessment.patient_id}</DetailRow>
        {patient && describePatient(patient) ? (
          <DetailRow label="Patient details">{describePatient(patient)}</DetailRow>
        ) : null}
        <DetailRow label="Assessment type">{TYPE_LABELS[assessment.type] ?? assessment.type}</DetailRow>
        <DetailRow label="Date and time">{formatDateTime(assessment.created_at)}</DetailRow>
        <DetailRow label="OA indication">
          {xray?.oa_indication ? 'OA-associated changes indicated' : 'No OA-associated changes indicated'}
        </DetailRow>
      </dl>

      {xray ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface-muted px-4 py-1">
          <DetailRow label="X-ray result">{resultHeadline(xray.oa_indication)}</DetailRow>
          <DetailRow label="Interpretation">{xray.interpretation}</DetailRow>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-line bg-surface-muted px-4 py-6 text-center text-sm text-ink-500">
          This assessment has no stored result yet.
        </p>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-ink-500">
          {DISCLAIMER} A full report, covering symptoms and gait, will be added once those modules
          are connected.
        </p>
      </div>
    </Card>
  )
}
