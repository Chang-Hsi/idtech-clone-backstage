import { useEffect, useMemo, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import FormField from '../../common/FormField'
import DropdownSelect from '../../common/DropdownSelect'
import DatePickerField from '../../common/DatePickerField'
import StatusMessage from '../../common/StatusMessage'
import useFormValidation from '../../../hooks/useFormValidation'
import {
  createBackstageResource,
  fetchBackstageResourceBySlug,
  updateBackstageResource,
} from '../../../api/backstageContentResourcesApi'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import { buildResourceEditorValidationSchema } from './ResourceEditorPage.schema'

const buildInitialForm = () => ({
  coverImageUrl: '',
  publishedAt: '',
  status: 'active',
  title: { en: '', zh: '' },
  excerpt: { en: '', zh: '' },
  contentMarkdown: { en: '', zh: '' },
})

const ResourceEditorPage = ({ mode }) => {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user } = useAuth()
  const { clearAll, getFieldError, validateField, validateMany } = useFormValidation()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [currentSlug, setCurrentSlug] = useState(slug ?? '')
  const [activeLocale, setActiveLocale] = useState('en')
  const [form, setForm] = useState(buildInitialForm)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewState, setPreviewState] = useState('idle')
  const previewBlurTimerRef = useRef(null)
  const previewImgRef = useRef(null)
  const validationSchema = useMemo(() => buildResourceEditorValidationSchema(form), [form])

  const validateByFieldName = (fieldName) =>
    validateField(fieldName, () => validateSchemaField(validationSchema, form, fieldName))

  useEffect(() => {
    if (mode !== 'edit' || !slug) return

    const load = async () => {
      setStatus('loading')
      setErrorMessage('')
      setValidationErrors([])
      try {
        const payload = await fetchBackstageResourceBySlug(slug)
        const resource = payload?.data?.resource
        if (!resource) throw new Error('Resource not found')

        setCurrentSlug(resource.slug)
        setForm({
          coverImageUrl: resource.coverImageUrl ?? '',
          publishedAt: resource.publishedAt ?? '',
          status: resource.status ?? 'active',
          title: { en: resource.title?.en ?? '', zh: resource.title?.zh ?? '' },
          excerpt: { en: resource.excerpt?.en ?? '', zh: resource.excerpt?.zh ?? '' },
          contentMarkdown: {
            en: resource.contentMarkdown?.en ?? '',
            zh: resource.contentMarkdown?.zh ?? '',
          },
        })
        const nextPreview = resource.coverImageUrl ?? ''
        setPreviewUrl(nextPreview)
        if (!nextPreview) setPreviewState('idle')
        setStatus('success')
        clearAll()
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load resource')
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
    if (!previewUrl) {
      setPreviewState('idle')
      return
    }

    setPreviewState('loading')
    const immediateImg = previewImgRef.current
    if (immediateImg?.complete) {
      setPreviewState(immediateImg.naturalWidth > 0 ? 'loaded' : 'error')
      return
    }

    let isCancelled = false
    const probe = new Image()
    const fallbackTimerId = window.setTimeout(() => {
      if (isCancelled) return
      const fallbackImg = previewImgRef.current
      if (fallbackImg?.complete && fallbackImg.naturalWidth > 0) setPreviewState('loaded')
      else if (fallbackImg?.complete && fallbackImg.naturalWidth === 0) setPreviewState('error')
    }, 1200)

    probe.onload = () => {
      if (isCancelled) return
      setPreviewState('loaded')
    }
    probe.onerror = () => {
      if (isCancelled) return
      setPreviewState('error')
    }
    probe.src = previewUrl

    return () => {
      isCancelled = true
      window.clearTimeout(fallbackTimerId)
      probe.onload = null
      probe.onerror = null
    }
  }, [previewUrl])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateLocalizedField = (group, locale, value) => {
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] ?? {}),
        [locale]: value,
      },
    }))
  }

  const syncPreviewAfterBlur = () => {
    if (previewBlurTimerRef.current) clearTimeout(previewBlurTimerRef.current)

    previewBlurTimerRef.current = setTimeout(() => {
      const nextPreview = form.coverImageUrl?.trim() ?? ''
      if (!nextPreview) {
        setPreviewUrl('')
        setPreviewState('idle')
        return
      }
      if (nextPreview === previewUrl) return
      setPreviewUrl(nextPreview)
    }, 500)
  }

  const submit = async (event) => {
    event.preventDefault()
    const quickValid = validateMany(
      validationSchema.map((field) => ({
        name: field.name,
        validate: () => validateSchemaField(validationSchema, form, field.name),
      })),
    )
    const validation = validateSchema(validationSchema, form)
    if (!quickValid || !validation.valid) {
      setStatus('error')
      setErrorMessage('Please fix the validation errors before saving.')
      setValidationErrors(validation.errors)
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setValidationErrors([])

    try {
      const payload = { ...form, updatedBy: editorId }
      if (mode === 'create') {
        await createBackstageResource(payload)
      } else {
        await updateBackstageResource(slug, payload)
      }
      navigate('/pages/content/resources', { replace: true })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save resource')
    }
  }

  const isBusy = status === 'loading' || status === 'saving'
  const sharedPreviewOptions = { className: 'md-prose' }
  const localeLabel = activeLocale === 'en' ? 'English' : '中文'

  return (
    <section className="space-y-4" data-color-mode="light">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {mode === 'create' ? 'Create Resource' : 'Edit Resource'}
            </h1>
          </div>
          <Link
            to="/pages/content/resources"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back to List
          </Link>
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

      <form onSubmit={submit} className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Basic</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Slug">
              <input
                value={mode === 'edit' ? currentSlug : '(Auto generated after create)'}
                readOnly
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500"
              />
            </FormField>

            <FormField label="Published At" required error={getFieldError('publishedAt')}>
              <DatePickerField
                value={form.publishedAt}
                onChange={(nextValue) => updateField('publishedAt', nextValue)}
                onBlur={() => validateByFieldName('publishedAt')}
              />
            </FormField>

            <FormField
              label="Cover Image URL"
              required
              className="md:col-span-2"
              error={getFieldError('coverImageUrl')}
            >
              <input
                value={form.coverImageUrl}
                onChange={(event) => updateField('coverImageUrl', event.target.value)}
                onBlur={() => {
                  syncPreviewAfterBlur()
                  validateByFieldName('coverImageUrl')
                }}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-slate-700">Background Preview</p>
              {!previewUrl ? (
                <div className="flex h-36 w-36 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                  No image URL
                </div>
              ) : (
                <div className="relative h-36 w-36 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {previewState === 'error' ? (
                    <div className="flex h-full w-full items-center justify-center text-xs text-rose-600">
                      Image failed to load
                    </div>
                  ) : null}
                  <img
                    ref={previewImgRef}
                    src={previewUrl}
                    alt="Resource preview"
                    className={`h-full w-full object-cover ${previewState === 'error' ? 'hidden' : ''}`}
                    onLoad={() => setPreviewState('loaded')}
                    onError={() => setPreviewState('error')}
                  />
                  {previewState === 'loading' ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-slate-600">
                      Loading preview...
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <FormField label="Status" className="md:max-w-[220px]" error={getFieldError('status')}>
              <DropdownSelect
                value={form.status}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
                onChange={(nextValue) => updateField('status', nextValue)}
                onBlur={() => validateByFieldName('status')}
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Localized Meta</h2>
          <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveLocale('en')}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeLocale === 'en'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveLocale('zh')}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeLocale === 'zh'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              中文
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            <FormField
              label={`Title (${localeLabel}, en/zh at least one)`}
              required
              error={getFieldError(`title.${activeLocale}`)}
            >
              <input
                value={form.title[activeLocale]}
                onChange={(event) => updateLocalizedField('title', activeLocale, event.target.value)}
                onBlur={() => {
                  validateByFieldName('title.en')
                  validateByFieldName('title.zh')
                }}
                placeholder={activeLocale === 'en' ? 'English title' : '中文標題'}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField
              label={`Excerpt (${localeLabel}, en/zh at least one)`}
              required
              error={getFieldError(`excerpt.${activeLocale}`)}
            >
              <textarea
                rows={3}
                value={form.excerpt[activeLocale]}
                onChange={(event) => updateLocalizedField('excerpt', activeLocale, event.target.value)}
                onBlur={() => {
                  validateByFieldName('excerpt.en')
                  validateByFieldName('excerpt.zh')
                }}
                placeholder={activeLocale === 'en' ? 'English excerpt' : '中文摘要'}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Markdown Content</h2>
          <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveLocale('en')}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeLocale === 'en'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveLocale('zh')}
              className={`border-b-2 pb-2 text-sm font-medium ${
                activeLocale === 'zh'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              中文
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <FormField
              label={`Content (${localeLabel}, en/zh at least one)`}
              required
              error={getFieldError(`contentMarkdown.${activeLocale}`)}
            >
              <div />
            </FormField>
            <MDEditor
              value={form.contentMarkdown[activeLocale]}
              onChange={(value) => updateLocalizedField('contentMarkdown', activeLocale, value ?? '')}
              preview="live"
              visibleDragbar={false}
              height={520}
              textareaProps={{
                placeholder: activeLocale === 'en' ? '# English resource article' : '# 中文資源文章',
                onBlur: () => {
                  validateByFieldName('contentMarkdown.en')
                  validateByFieldName('contentMarkdown.zh')
                },
              }}
              previewOptions={sharedPreviewOptions}
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <Link
            to="/pages/content/resources"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {status === 'saving' ? 'Saving...' : 'Save Resource'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ResourceEditorPage
