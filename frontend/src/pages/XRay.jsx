import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ClipboardList,
  FileImage,
  FileText,
  Loader2,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import { buttonClasses } from '../components/ui/buttonStyles'
import { ApiError } from '../services/api'
import { analyzeXray } from '../services/xrayService'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const ACCEPTED_LABEL = 'JPG, JPEG, PNG'
const MAX_SIZE_BYTES = 20 * 1024 * 1024

// Only the short result is shown on this page. The backend also returns the
// class probabilities, and those are deliberately not displayed here.
const RESULT_COPY = {
  healthyHeading: 'No OA-associated changes indicated',
  healthy: 'No significant OA pattern detected by the model.',
  indicatedHeading: 'OA-associated changes indicated',
  indicated: 'The model detected an OA-associated pattern in the X-ray.',
}

const DISCLAIMER = 'This is an AI-assisted preliminary assessment and is not a medical diagnosis.'

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

export default function XRay() {
  const inputRef = useRef(null)
  const activeRequest = useRef(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState(null)

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
    if (!file || isAnalyzing) return

    setError('')
    setPrediction(null)
    setIsAnalyzing(true)

    // Created here so the request can be cancelled if the page is left.
    const controller = new AbortController()
    activeRequest.current = controller

    try {
      const result = await analyzeXray(file, { signal: controller.signal })
      setPrediction(result)
    } catch (requestError) {
      if (requestError?.name === 'AbortError') return

      setError(describeError(requestError))
    } finally {
      activeRequest.current = null
      setIsAnalyzing(false)
    }
  }

  const isHealthy = prediction?.predicted_class === HEALTHY_CLASS

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

        {prediction ? (
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
              <p className="text-xs leading-relaxed text-ink-400">{DISCLAIMER}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled
                  className={buttonClasses({ variant: 'primary', size: 'md', className: 'w-full' })}
                >
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Add Symptoms
                </button>
                <button
                  type="button"
                  disabled
                  className={buttonClasses({ variant: 'secondary', size: 'md', className: 'w-full' })}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  View Full Report
                </button>
              </div>

              <p className="mt-4 text-xs text-ink-400">
                Both actions open once the assessment modules are connected.
              </p>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
