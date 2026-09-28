import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  ClipboardList,
  FileImage,
  FileText,
  Loader2,
  LogIn,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import AssessmentReport from '../components/AssessmentReport'
import PatientHeader from '../components/PatientHeader'
import PatientOverview from '../components/PatientOverview'
import PatientSelect from '../components/PatientSelect'
import { buttonClasses } from '../components/ui/buttonStyles'
import { useAuth } from '../hooks/useAuth'
import { usePatient } from '../hooks/usePatient'
import { ROUTES } from '../routes'
import { ApiError } from '../services/api'
import { listAssessments } from '../services/assessmentService'
import { analyzeXray } from '../services/xrayService'
import { createPatient, listPatients, toPatient, toPatientList } from '../services/patientService'
import { DISCLAIMER, RESULT_COPY } from '../constants/resultCopy'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const ACCEPTED_LABEL = 'JPG, JPEG, PNG'
const MAX_SIZE_BYTES = 20 * 1024 * 1024

// Where the page currently is. Patient selection comes first, then that
// patient's overview, then the upload itself.
const VIEW = {
  patients: 'patients',
  overview: 'overview',
  xray: 'xray',
  report: 'report',
}

const HEALTHY_CLASS = 'Healthy'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Turn a failed request into a short message the user can act on. */
function describeError(error) {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong while analysing the image. Please try again.'
  }

  if (error.status === 0) {
    return 'Cannot reach the OA Assist server. Make sure the backend is running, then try again.'
  }

  if (error.status === 401) {
    return 'Please sign in to run the X-ray assessment.'
  }

  if (error.status === 400 || error.status === 413 || error.status === 415) {
    return error.message
  }

  if (error.status === 503) {
    return 'The X-ray assessment service is temporarily unavailable. Please try again shortly.'
  }

  return error.message
}

/** Turn a failed assessment-history request into a short, actionable message. */
function describeAssessmentError(error) {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong while loading the assessment history. Please try again.'
  }

  if (error.status === 0) {
    return 'Cannot reach the OA Assist server. Make sure the backend is running, then try again.'
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.status === 404) {
    return 'That patient is no longer available. Please choose another patient.'
  }

  return error.message
}

/**
 * Turn a failed patient request into a short, actionable message.
 *
 * Patient records are account data, so a `401` here means the session went away
 * and the sign-in prompt is the right thing to show rather than an error.
 */
function describePatientError(error) {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong with your patients. Please try again.'
  }

  if (error.status === 0) {
    return 'Cannot reach the OA Assist server. Make sure the backend is running, then try again.'
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.status === 503) {
    return 'Patient records are temporarily unavailable. Please try again shortly.'
  }

  if (error.status === 422) {
    return 'Please check the patient details and try again.'
  }

  return error.message
}

export default function XRay() {
  const inputRef = useRef(null)
  const activeRequest = useRef(null)
  const { isAuthenticated, isAuthenticating } = useAuth()
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState(null)

  // Patient state. MongoDB is the source of truth: the list is re-read from
  // GET /api/patients on every visit and nothing is kept in localStorage.
  const [patients, setPatients] = useState([])
  const [patientsError, setPatientsError] = useState('')
  const [arePatientsSettled, setArePatientsSettled] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)
  const [createPatientError, setCreatePatientError] = useState('')
  // Shared with the symptoms and report pages so the patient survives a
  // navigation without ever appearing in the URL. In memory only, so a refresh
  // clears it and the next visit starts at patient selection.
  const { patient: selectedPatient, setPatient: setSelectedPatient } = usePatient()

  // Where the page is, and the saved assessment being reported on. A patient
  // carried in from another module (symptoms, report) lands straight on that
  // patient's overview; with no patient, the list is the starting point.
  const [view, setView] = useState(() => (selectedPatient ? VIEW.overview : VIEW.patients))
  const [assessments, setAssessments] = useState([])
  const [historyError, setHistoryError] = useState('')
  const [areHistorySettled, setAreHistorySettled] = useState(false)
  const [historyToken, setHistoryToken] = useState(0)
  const [reportedAssessment, setReportedAssessment] = useState(null)

  // Derived rather than assigned inside an effect, so no render is triggered by
  // the fetch starting.
  const isLoadingPatients = isAuthenticated && !arePatientsSettled
  const isLoadingHistory = view === VIEW.overview && !areHistorySettled

  // Derived from the file so React never has to sync it in an effect.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  // Release the object URL so the preview does not leak when the file changes.
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  // Cancel an in-flight analysis if the page is left.
  useEffect(
    () => () => {
      activeRequest.current?.abort()
    },
    [],
  )

  // Read the signed-in user's patients. This only runs once the backend has
  // confirmed the session, so a guest never calls a protected endpoint.
  useEffect(() => {
    if (!isAuthenticated) return undefined

    const controller = new AbortController()

    listPatients({ signal: controller.signal })
      .then((data) => {
        setPatients(toPatientList(data))
        setPatientsError('')
        setArePatientsSettled(true)
      })
      .catch((requestError) => {
        // Ignore a request this effect cancelled itself (unmount, or a reload
        // triggered by the retry button); that is not a failure to report.
        if (controller.signal.aborted || requestError?.name === 'AbortError') return

        setPatientsError(describePatientError(requestError))
        setArePatientsSettled(true)
      })

    return () => controller.abort()
  }, [isAuthenticated, reloadToken])

  // Retrying is an event, so the loading state is reset from the click rather
  // than from inside the effect.
  const handleRetryPatients = () => {
    setArePatientsSettled(false)
    setPatientsError('')
    setReloadToken((current) => current + 1)
  }

  // Load the selected patient's real saved history. Every row comes from the
  // API: an empty list genuinely means this patient has no assessments.
  useEffect(() => {
    if (view !== VIEW.overview || !selectedPatient) return undefined

    const controller = new AbortController()

    listAssessments(selectedPatient.patient_id, { signal: controller.signal })
      .then((data) => {
        setAssessments(data)
        setHistoryError('')
        setAreHistorySettled(true)
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError?.name === 'AbortError') return

        setHistoryError(describeAssessmentError(requestError))
        setAreHistorySettled(true)
      })

    return () => controller.abort()
  }, [view, selectedPatient, historyToken])

  const handleRetryHistory = () => {
    setAreHistorySettled(false)
    setHistoryError('')
    setHistoryToken((current) => current + 1)
  }

  const selectFile = (nextFile) => {
    if (!nextFile) return

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError(`Unsupported file type. Upload a ${ACCEPTED_LABEL} image.`)
      return
    }

    if (nextFile.size > MAX_SIZE_BYTES) {
      setError('That image is larger than 20 MB. Please choose a smaller file.')
      return
    }

    setError('')
    setPrediction(null)
    setFile(nextFile)
  }

  const clearSelection = () => {
    activeRequest.current?.abort()
    activeRequest.current = null
    setFile(null)
    setError('')
    setPrediction(null)
    setIsAnalyzing(false)

    if (inputRef.current) {
      // Reset so picking the same file again still fires a change event.
      inputRef.current.value = ''
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files?.[0])
  }

  const handleAnalyze = async () => {
    if (!file || isAnalyzing || !selectedPatient) return

    setError('')
    setPrediction(null)
    setIsAnalyzing(true)

    // Created here so the request can be cancelled if the page is left.
    const controller = new AbortController()
    activeRequest.current = controller

    try {
      // The backend runs the model and saves the result against this patient,
      // so the response carries the assessment it stored.
      const result = await analyzeXray(file, {
        patientId: selectedPatient.patient_id,
        signal: controller.signal,
      })
      setPrediction(result)
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.name === 'AbortError') return

      setError(describeError(requestError))
    } finally {
      activeRequest.current = null
      setIsAnalyzing(false)
    }
  }

  const isHealthy = prediction?.predicted_class === HEALTHY_CLASS

  // "Assessment saved" may only appear once the backend has confirmed the write,
  // which it signals by returning the id of the assessment it stored.
  const isSaved = Boolean(prediction?.assessment_id && prediction?.created_at)

  // The save response is reshaped to the same shape a history row has, so the
  // report view works for a just-saved result and an older one alike.
  const savedAssessment = isSaved
    ? {
        id: prediction.assessment_id,
        patient_id: prediction.patient_id,
        type: prediction.type ?? 'xray',
        xray: {
          predicted_class: prediction.predicted_class,
          oa_indication: prediction.oa_indication,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities,
          interpretation: prediction.interpretation,
          note: prediction.note,
        },
        created_at: prediction.created_at,
      }
    : null

  const handleCreatePatient = async (payload) => {
    setIsCreatingPatient(true)
    setCreatePatientError('')

    try {
      const created = toPatient(await createPatient(payload))

      if (!created) {
        setCreatePatientError('The patient could not be created. Please try again.')
        return
      }

      // The API returns the generated id, so the new patient goes straight to the
      // top of the list and is selected, ready for the upload.
      setPatients((current) => [created, ...current])
      setSelectedPatient(created)
      setView(VIEW.overview)
      setAssessments([])
      setAreHistorySettled(false)
      setHistoryError('')
    } catch (requestError) {
      setCreatePatientError(describePatientError(requestError))
    } finally {
      setIsCreatingPatient(false)
    }
  }

  // Choosing an existing patient opens their overview, never a new X-ray
  // straight away: an existing patient must be reused, never duplicated.
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient)
    setView(VIEW.overview)
    setAssessments([])
    setAreHistorySettled(false)
    setHistoryError('')
    setReportedAssessment(null)
    clearSelection()
  }

  // The X-ray module is the only implemented one, so "New Assessment" starts an
  // X-ray assessment directly. Picking the patient first still opens their
  // overview, which is where the history lives.
  const openNewXray = (patient) => {
    setSelectedPatient(patient)
    setAssessments([])
    setAreHistorySettled(false)
    setHistoryError('')
    setReportedAssessment(null)
    clearSelection()
    setView(VIEW.xray)
  }

  const handleStartNewAssessment = () => {
    if (!selectedPatient) return

    openNewXray(selectedPatient)
  }

  const handleChangePatient = () => {
    setSelectedPatient(null)
    setReportedAssessment(null)
    setAssessments([])
    setView(VIEW.patients)
    clearSelection()
  }

  const handleViewReport = (assessment) => {
    setReportedAssessment(assessment)
    setView(VIEW.report)
  }

  const handleBackFromReport = () => {
    setReportedAssessment(null)
    setView(VIEW.overview)
  }

  // Returning to the overview re-reads the history, so a result saved a moment
  // ago is really there rather than a stale local copy.
  const handleBackToOverview = () => {
    clearSelection()
    setAreHistorySettled(false)
    setHistoryError('')
    setHistoryToken((current) => current + 1)
    setView(VIEW.overview)
  }

  return (
    <div className="container-page py-10 sm:py-12">
      <PageHeader
        eyebrow="Assessment module"
        title="X-Ray Assessment"
        subtitle="Upload your knee X-ray for an AI-assisted preliminary assessment."
        status="Prototype"
        statusTone="brand"
      />

      <div className="mt-8 space-y-6">
        {isAuthenticating ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center" aria-busy="true">
            <Loader2 className="h-7 w-7 animate-spin text-plum-500" aria-hidden="true" />
            <p className="mt-4 text-sm text-ink-500">Checking your session...</p>
          </Card>
        ) : null}

        {!isAuthenticating && !isAuthenticated ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-sage-600"
              aria-hidden="true"
            >
              <LogIn className="h-7 w-7" />
            </span>

            <h2 className="mt-6 text-lg font-semibold text-sage-900">
              Sign in to run an X-ray assessment
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              X-ray assessment is linked to a patient record, so it needs a signed-in account.
              Guest sessions can explore the interface, but nothing is analysed or stored until you
              sign in.
            </p>

            <Link
              to={ROUTES.login}
              className={buttonClasses({ variant: 'primary', className: 'mt-6' })}
            >
              Sign In
            </Link>

            <p className="mt-4 text-sm text-ink-500">
              No account yet?{' '}
              <Link to={ROUTES.signup} className="font-medium text-plum-700 hover:text-plum-800">
                Create one
              </Link>
            </p>
          </Card>
        ) : null}

        {isAuthenticated && view === VIEW.patients ? (
          <PatientSelect
            patients={patients}
            isLoading={isLoadingPatients}
            loadError={patientsError}
            isCreating={isCreatingPatient}
            createError={createPatientError}
            onRetryLoad={handleRetryPatients}
            onSelectPatient={handleSelectPatient}
            onStartNewAssessment={openNewXray}
            onCreatePatient={handleCreatePatient}
          />
        ) : null}

        {isAuthenticated && selectedPatient && view === VIEW.overview ? (
          <PatientOverview
            patient={selectedPatient}
            assessments={assessments}
            isLoading={isLoadingHistory}
            error={historyError}
            onRetry={handleRetryHistory}
            onNewAssessment={handleStartNewAssessment}
            onViewReport={handleViewReport}
            onChangePatient={handleChangePatient}
          />
        ) : null}

        {isAuthenticated && selectedPatient && view === VIEW.report ? (
          <AssessmentReport
            assessment={reportedAssessment}
            patient={selectedPatient}
            onBack={handleBackFromReport}
          />
        ) : null}

        {isAuthenticated && selectedPatient && view === VIEW.xray ? (
          <PatientHeader
            patient={selectedPatient}
            title="New X-Ray Assessment"
            onBack={handleBackToOverview}
            onChange={handleChangePatient}
          />
        ) : null}

        {isAuthenticated && selectedPatient && view === VIEW.xray ? (
          <Card className="p-6 sm:p-8">
          {!file ? (
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-200 ${
                isDragging
                  ? 'border-plum-300 bg-plum-50/60'
                  : 'border-sage-300 bg-surface-warm hover:border-plum-300 hover:bg-plum-50/40'
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-plum-600">
                <UploadCloud className="h-7 w-7" aria-hidden="true" />
              </span>

              <h2 className="mt-5 text-base font-semibold text-sage-900">
                Drag and drop your X-ray image here
              </h2>

              <p className="mt-2 text-sm text-ink-500">or</p>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={buttonClasses({ variant: 'primary', className: 'mt-4' })}
              >
                Choose File
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={(event) => selectFile(event.target.files?.[0])}
                className="sr-only"
                aria-label="Choose an X-ray image"
              />

              <p className="mt-4 text-xs text-ink-400">
                Accepted formats: {ACCEPTED_LABEL} &bull; Maximum size: 20 MB
              </p>
            </div>
          ) : (
            <div>
              <div className="relative overflow-hidden rounded-2xl border border-line bg-sage-900">
                <img
                  src={previewUrl}
                  alt={`Preview of the selected X-ray: ${file.name}`}
                  className="max-h-[420px] w-full object-contain"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sage-200 bg-sage-50 text-plum-600"
                    aria-hidden="true"
                  >
                    <FileImage className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-sage-900">{file.name}</p>
                    <p className="text-xs text-ink-500">{formatSize(file.size)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isAnalyzing}
                  className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Remove
                </button>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={buttonClasses({ variant: 'primary', className: 'mt-5 w-full' })}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" aria-hidden="true" />
                    Analyze X-Ray
                  </>
                )}
              </button>
            </div>
          )}

          {error ? (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-xl border border-error-100 bg-error-100 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-700" aria-hidden="true" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          ) : null}
          </Card>
        ) : null}

        {isAuthenticated && selectedPatient && view === VIEW.xray && prediction ? (
          <Card className="animate-fade-up overflow-hidden p-0">
            {/* The headline of the assessment, given the most visual weight. */}
            <div
              className={`flex flex-col items-start gap-4 border-b px-6 py-7 sm:flex-row sm:items-center sm:gap-5 sm:px-8 ${
                isHealthy ? 'border-sage-200 bg-sage-50' : 'border-plum-200 bg-plum-50'
              }`}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  isHealthy
                    ? 'border border-sage-200 bg-surface-warm text-sage-700'
                    : 'border border-plum-200 bg-surface-warm text-plum-700'
                }`}
                aria-hidden="true"
              >
                {isHealthy ? (
                  <ShieldCheck className="h-7 w-7" />
                ) : (
                  <Activity className="h-7 w-7" />
                )}
              </span>

              <div className="min-w-0">
                <h2
                  className={`text-xl font-semibold tracking-tight sm:text-2xl ${
                    isHealthy ? 'text-sage-900' : 'text-plum-900'
                  }`}
                >
                  {isHealthy ? RESULT_COPY.healthyHeading : RESULT_COPY.indicatedHeading}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                  {isHealthy ? RESULT_COPY.healthy : RESULT_COPY.indicated}
                </p>
              </div>

              <div className="sm:ml-auto sm:shrink-0">
                <Badge tone={isHealthy ? 'success' : 'warning'} dot>
                  Preliminary
                </Badge>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-7">
              {/* Which patient this result belongs to, and the save state the
                  backend actually reported. */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <p className="text-sm text-ink-500">
                  Patient:{' '}
                  <span className="font-medium text-sage-900">
                    {selectedPatient.name} &bull; {selectedPatient.patient_id}
                  </span>
                </p>

                {isSaved ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success" dot>
                      Assessment saved
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleViewReport(savedAssessment)}
                      className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      View Report
                    </button>
                  </div>
                ) : null}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-ink-400">{DISCLAIMER}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {/*
                  Navigation only. Both modules are placeholders today, so
                  neither performs any work here: they just carry the selected
                  patient to the next page.
                */}
                <Link
                  to={ROUTES.symptoms}
                  className={buttonClasses({ variant: 'primary', size: 'md', className: 'w-full' })}
                >
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Add Symptoms
                </Link>
                <Link
                  to={ROUTES.report}
                  className={buttonClasses({ variant: 'secondary', size: 'md', className: 'w-full' })}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  View Full Report
                </Link>
              </div>

              <p className="mt-4 text-xs text-ink-400">
                Both actions open for {selectedPatient.name} &middot; {selectedPatient.patient_id}.
                The modules themselves are still placeholders.
              </p>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
