import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import PatientContextBar from '../components/PatientContextBar'
import { buttonClasses } from '../components/ui/buttonStyles'
import { DISCLAIMER } from '../constants/resultCopy'
import { ROUTES } from '../routes'

/**
 * Combined assessment report.
 *
 * This is navigation only for now: the X-ray result's "View Full Report" button
 * brings the user here with the selected patient. No report is assembled and no
 * results are invented; the stored X-ray result is still readable from the
 * patient's history in the X-ray module.
 */
export default function Report() {
  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Assessment module"
        title="Assessment Report"
        subtitle="A combined summary of the assessments run for this patient."
        status="Report planned"
        statusTone="brand"
        backTo={ROUTES.dashboard}
      />

      <div className="mt-8 space-y-6">
        <PatientContextBar title="The assessment report" />

        <Card className="flex flex-col items-center px-6 py-14 text-center sm:px-8">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-plum-600"
            aria-hidden="true"
          >
            <FileText className="h-7 w-7" />
          </span>

          <p className="mt-6 text-base font-semibold text-sage-900">
            Your assessment report will appear here.
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            Report generation is not built yet, so nothing is shown here. Individual X-ray results
            are already saved and can be opened from the patient&apos;s history.
          </p>

          <Link
            to={ROUTES.xray}
            className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}
          >
            Back to X-Ray Assessment
          </Link>
        </Card>

        <p className="text-xs leading-relaxed text-ink-400">{DISCLAIMER}</p>
      </div>
    </div>
  )
}
