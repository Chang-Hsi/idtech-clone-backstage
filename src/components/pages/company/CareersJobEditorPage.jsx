import { useEffect, useMemo, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthProvider'
import FormField from '../../common/FormField'
import DropdownSelect from '../../common/DropdownSelect'
import StatusMessage from '../../common/StatusMessage'
import useFormValidation from '../../../hooks/useFormValidation'
import {
  fetchBackstageCompanyCareers,
  updateBackstageCompanyCareers,
} from '../../../api/backstageCompanyCareersApi'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import { buildCareersJobEditorValidationSchema } from './CareersJobEditorPage.schema'
import {
  STATUS_ACTIVE,
  STATUS_ARCHIVED,
  buildCareersUpdatePayload,
  buildUniqueSlug,
  createId,
  normalizeCareersPayload,
} from './careers/careersFormUtils'

const MARKDOWN_TAB_DUTIES = 'duties'
const MARKDOWN_TAB_QUALIFICATIONS = 'qualifications'

const buildInitialJobForm = () => ({
  id: '',
  slug: '',
  title: '',
  region: '',
  countryCode: '',
  employmentType: 'FULL-TIME',
  locationLabel: '',
  imageUrl: '',
  summary: '',
  jobDutiesMarkdown: '',
  qualificationsMarkdown: '',
  applyEmail: '',
  isOpen: true,
})

const CareersJobEditorPage = ({ mode }) => {
  const { user } = useAuth()
  const { slug } = useParams()
  const navigate = useNavigate()
  const { clearAll, getFieldError, validateField, validateMany } = useFormValidation()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [careersForm, setCareersForm] = useState(() => normalizeCareersPayload(null))
  const [jobForm, setJobForm] = useState(buildInitialJobForm)
  const [markdownTab, setMarkdownTab] = useState(MARKDOWN_TAB_DUTIES)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [imagePreviewState, setImagePreviewState] = useState('idle')
  const previewBlurTimerRef = useRef(null)
  const previewImgRef = useRef(null)

  const regionTabs = useMemo(
    () => careersForm.tabs.filter((tab) => tab.key && tab.key !== 'all'),
    [careersForm.tabs],
  )

  const validationSchema = useMemo(
    () => buildCareersJobEditorValidationSchema(regionTabs.map((tab) => tab.key)),
    [regionTabs],
  )

  const validateByFieldName = (fieldName) =>
    validateField(fieldName, () => validateSchemaField(validationSchema, jobForm, fieldName))

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      setErrorMessage('')
      setValidationErrors([])
      try {
        const payload = await fetchBackstageCompanyCareers()
        const page = payload?.data?.careersPage
        const normalized = normalizeCareersPayload(page)
        setCareersForm(normalized)
        setUpdatedAt(page?.updatedAt ?? '')

        if (mode === 'create') {
          const defaultRegionTab = normalized.tabs.find((tab) => tab.key && tab.key !== 'all')
          const nextForm = {
            ...buildInitialJobForm(),
            id: createId('job'),
            region: defaultRegionTab?.label ?? '',
            countryCode: defaultRegionTab?.key ?? '',
          }
          setJobForm(nextForm)
          setImagePreviewUrl(nextForm.imageUrl ?? '')
          if (!nextForm.imageUrl) setImagePreviewState('idle')
        } else {
          const target = normalized.jobs.find((job) => job.slug === slug)
          if (!target) {
            throw new Error('Career job not found.')
          }
          const nextForm = {
            id: target.id,
            slug: target.slug,
            title: target.title,
            region: target.region,
            countryCode: target.countryCode,
            employmentType: target.employmentType,
            locationLabel: target.locationLabel,
            imageUrl: target.imageUrl,
            summary: target.summary,
            jobDutiesMarkdown: target.jobDutiesMarkdown,
            qualificationsMarkdown: target.qualificationsMarkdown,
            applyEmail: target.applyEmail,
            isOpen: target.isOpen,
          }
          setJobForm(nextForm)
          setImagePreviewUrl(nextForm.imageUrl ?? '')
          if (!nextForm.imageUrl) setImagePreviewState('idle')
        }

        setStatus('success')
        clearAll()
      } catch (error) {
        setStatus('error')
        setErrorMessage(error?.message || 'Unable to load careers content.')
      }
    }

    load()
  }, [clearAll, mode, slug])

  useEffect(() => {
    return () => {
      if (previewBlurTimerRef.current) clearTimeout(previewBlurTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!imagePreviewUrl) {
      setImagePreviewState('idle')
      return
    }

    setImagePreviewState('loading')
    const immediateImg = previewImgRef.current
    if (immediateImg?.complete) {
      if (immediateImg.naturalWidth > 0) {
        setImagePreviewState('loaded')
      } else {
        setImagePreviewState('error')
      }
      return
    }

    let isCancelled = false
    const probe = new Image()
    const fallbackTimerId = window.setTimeout(() => {
      if (isCancelled) return
      const fallbackImg = previewImgRef.current
      if (fallbackImg?.complete && fallbackImg.naturalWidth > 0) {
        setImagePreviewState('loaded')
      } else if (fallbackImg?.complete && fallbackImg.naturalWidth === 0) {
        setImagePreviewState('error')
      }
    }, 1200)

    probe.onload = () => {
      if (isCancelled) return
      setImagePreviewState('loaded')
    }

    probe.onerror = () => {
      if (isCancelled) return
      setImagePreviewState('error')
    }

    probe.src = imagePreviewUrl

    return () => {
      isCancelled = true
      window.clearTimeout(fallbackTimerId)
      probe.onload = null
      probe.onerror = null
    }
  }, [imagePreviewUrl])

  const updateField = (field, value) => {
    setJobForm((prev) => ({ ...prev, [field]: value }))
  }

  const syncImagePreviewAfterBlur = () => {
    if (previewBlurTimerRef.current) clearTimeout(previewBlurTimerRef.current)

    previewBlurTimerRef.current = setTimeout(() => {
      const nextPreview = jobForm.imageUrl?.trim() ?? ''
      if (!nextPreview) {
        setImagePreviewUrl('')
        setImagePreviewState('idle')
        return
      }

      if (nextPreview === imagePreviewUrl) return
      setImagePreviewUrl(nextPreview)
    }, 500)
  }

  const save = async () => {
    const nextJob = {
      ...jobForm,
      title: jobForm.title.trim(),
      region: jobForm.region.trim(),
      countryCode: jobForm.countryCode.trim().toLowerCase(),
      employmentType: jobForm.employmentType.trim(),
      locationLabel: jobForm.locationLabel.trim(),
      imageUrl: jobForm.imageUrl.trim(),
      summary: jobForm.summary.trim(),
      applyEmail: jobForm.applyEmail.trim(),
      jobDutiesMarkdown: jobForm.jobDutiesMarkdown.trim(),
      qualificationsMarkdown: jobForm.qualificationsMarkdown.trim(),
    }

    const quickValid = validateMany(
      validationSchema.map((field) => ({
        name: field.name,
        validate: () => validateSchemaField(validationSchema, nextJob, field.name),
      })),
    )
    const validation = validateSchema(validationSchema, nextJob)
    if (!quickValid || !validation.valid) {
      setStatus('error')
      setErrorMessage('Please fix the validation errors before saving.')
      setValidationErrors(validation.errors)
      setSuccessMessage('')
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setValidationErrors([])
    setSuccessMessage('')

    try {
      const nextJobs =
        mode === 'create'
          ? [
              ...careersForm.jobs,
              {
                ...nextJob,
                id: nextJob.id || createId('job'),
                slug: '',
                sortOrder: careersForm.jobs.length,
              },
            ]
          : careersForm.jobs.map((job) =>
              job.id === nextJob.id
                ? {
                    ...job,
                    ...nextJob,
                  }
                : job,
            )

      await updateBackstageCompanyCareers(
        buildCareersUpdatePayload({ ...careersForm, jobs: nextJobs }, editorId),
      )

      navigate('/pages/content/company/careers', { replace: true })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error?.message || 'Unable to save career job.')
    }
  }

  const computedSlug =
    mode === 'create'
      ? buildUniqueSlug(jobForm.title, careersForm.jobs)
      : String(jobForm.slug ?? '').trim()

  return (
    <section className="space-y-4" data-color-mode="light">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {mode === 'create' ? 'Create Career Job' : 'Edit Career Job'}
            </h1>
            {updatedAt ? <p className="mt-1 text-xs text-slate-500">Last updated: {updatedAt}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/pages/content/company/careers"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Back to List
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={status === 'loading' || status === 'saving'}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {status === 'saving' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <StatusMessage tone="error" message={errorMessage}>
        {validationErrors.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationErrors.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </StatusMessage>
      <StatusMessage tone="success" message={successMessage} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Basic</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Slug">
            <input
              value={computedSlug || '(Auto generated after create)'}
              readOnly
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500"
            />
          </FormField>

          <FormField label="Status" required error={getFieldError('isOpen')}>
            <DropdownSelect
              value={jobForm.isOpen ? STATUS_ACTIVE : STATUS_ARCHIVED}
              options={[
                { value: STATUS_ACTIVE, label: 'Active' },
                { value: STATUS_ARCHIVED, label: 'Archived' },
              ]}
              onChange={(nextValue) => updateField('isOpen', nextValue === STATUS_ACTIVE)}
              onBlur={() => validateByFieldName('isOpen')}
            />
          </FormField>

          <FormField label="Title" required error={getFieldError('title')}>
            <input
              value={jobForm.title}
              onChange={(event) => updateField('title', event.target.value)}
              onBlur={() => validateByFieldName('title')}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Region" required error={getFieldError('region')}>
            <input
              value={jobForm.region}
              onChange={(event) => updateField('region', event.target.value)}
              onBlur={() => validateByFieldName('region')}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>

          <FormField label="countryCode" required error={getFieldError('countryCode')}>
            <DropdownSelect
              value={jobForm.countryCode}
              options={regionTabs.map((tab) => ({ value: tab.key, label: `${tab.label} (${tab.key})` }))}
              onChange={(nextValue) => updateField('countryCode', nextValue)}
              onBlur={() => validateByFieldName('countryCode')}
            />
          </FormField>

          <FormField label="Employment Type" required error={getFieldError('employmentType')}>
            <input
              value={jobForm.employmentType}
              onChange={(event) => updateField('employmentType', event.target.value)}
              onBlur={() => validateByFieldName('employmentType')}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Location Label" required className="md:col-span-2" error={getFieldError('locationLabel')}>
            <input
              value={jobForm.locationLabel}
              onChange={(event) => updateField('locationLabel', event.target.value)}
              onBlur={() => validateByFieldName('locationLabel')}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Image URL" required className="md:col-span-2" error={getFieldError('imageUrl')}>
            <input
              value={jobForm.imageUrl}
              onChange={(event) => updateField('imageUrl', event.target.value)}
              onBlur={() => {
                syncImagePreviewAfterBlur()
                validateByFieldName('imageUrl')
              }}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Image Preview</p>
            {!imagePreviewUrl ? (
              <div className="flex h-28 w-28 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                No image URL
              </div>
            ) : (
              <div className="relative h-28 w-28 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {imagePreviewState === 'error' ? (
                  <div className="flex h-full w-full items-center justify-center text-xs text-rose-600">
                    Image failed to load
                  </div>
                ) : null}
                <img
                  ref={previewImgRef}
                  src={imagePreviewUrl}
                  alt="Career job preview"
                  className={`h-full w-full object-cover ${imagePreviewState === 'error' ? 'hidden' : ''}`}
                  onLoad={() => setImagePreviewState('loaded')}
                  onError={() => setImagePreviewState('error')}
                />
                {imagePreviewState === 'loading' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-slate-600">
                    Loading preview...
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <FormField label="Summary" required className="md:col-span-2" error={getFieldError('summary')}>
            <textarea
              rows={3}
              value={jobForm.summary}
              onChange={(event) => updateField('summary', event.target.value)}
              onBlur={() => validateByFieldName('summary')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Apply Email" required className="md:col-span-2" error={getFieldError('applyEmail')}>
            <input
              value={jobForm.applyEmail}
              onChange={(event) => updateField('applyEmail', event.target.value)}
              onBlur={() => validateByFieldName('applyEmail')}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Markdown Content</h2>
          <p className="text-xs text-slate-500">
            {markdownTab === MARKDOWN_TAB_DUTIES
              ? `${jobForm.jobDutiesMarkdown.length} chars`
              : `${jobForm.qualificationsMarkdown.length} chars`}
          </p>
        </div>

        <div className="mb-4 flex items-center gap-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMarkdownTab(MARKDOWN_TAB_DUTIES)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              markdownTab === MARKDOWN_TAB_DUTIES
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Job Duties
          </button>
          <button
            type="button"
            onClick={() => setMarkdownTab(MARKDOWN_TAB_QUALIFICATIONS)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              markdownTab === MARKDOWN_TAB_QUALIFICATIONS
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Qualifications
          </button>
        </div>

        {markdownTab === MARKDOWN_TAB_DUTIES ? (
          <FormField label="Job Duties " required error={getFieldError('jobDutiesMarkdown')}>
            <MDEditor
              value={jobForm.jobDutiesMarkdown}
              onChange={(value) => updateField('jobDutiesMarkdown', value ?? '')}
              preview="live"
              visibleDragbar={false}
              height={360}
              textareaProps={{
                placeholder: '- Incident management...',
                onBlur: () => validateByFieldName('jobDutiesMarkdown'),
              }}
              previewOptions={{ className: 'md-prose' }}
            />
          </FormField>
        ) : (
          <FormField label="Qualifications" required error={getFieldError('qualificationsMarkdown')}>
            <MDEditor
              value={jobForm.qualificationsMarkdown}
              onChange={(value) => updateField('qualificationsMarkdown', value ?? '')}
              preview="live"
              visibleDragbar={false}
              height={360}
              textareaProps={{
                placeholder: '- 3+ years ...',
                onBlur: () => validateByFieldName('qualificationsMarkdown'),
              }}
              previewOptions={{ className: 'md-prose' }}
            />
          </FormField>
        )}
      </section>
    </section>
  )
}

export default CareersJobEditorPage
