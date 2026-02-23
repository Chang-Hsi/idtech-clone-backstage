import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import DropdownSelect from '../../common/DropdownSelect'
import FormField from '../../common/FormField'
import StatusMessage from '../../common/StatusMessage'
import ImageSourceInputField from '../../common/ImageSourceInputField'
import ConfirmDialog from '../../dialog/ConfirmDialog'
import useFormValidation from '../../../hooks/useFormValidation'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import {
  fetchBackstageSeoTargetDetail,
  resetBackstageSeoTargetFallback,
  updateBackstageSeoTarget,
} from '../../../api/backstageSeoApi'
import { uploadBackstageImage } from '../../../api/backstageUploadsApi'
import {
  ROBOTS_OPTIONS,
  SEO_TYPE_OPTIONS,
  seoEditorSchema,
} from './SeoEditor.schema'

const createEmptyForm = () => ({
  seo: {
    title: '',
    description: '',
    canonicalPath: '/',
    ogImageUrl: '',
    type: 'website',
    noindex: false,
    robots: 'index,follow',
  },
})

const SeoManagerPage = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const selectedTargetKey = searchParams.get('target') ?? ''
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])

  const [selectedTargetDetail, setSelectedTargetDetail] = useState(null)
  const [form, setForm] = useState(createEmptyForm)

  const [isResetFallbackConfirmOpen, setIsResetFallbackConfirmOpen] = useState(false)
  const [previewViewport, setPreviewViewport] = useState('desktop')

  const [previewUrl, setPreviewUrl] = useState('')
  const [previewState, setPreviewState] = useState('idle')
  const [ogImageInputMode, setOgImageInputMode] = useState('url')
  const [ogImageUploadFile, setOgImageUploadFile] = useState(null)
  const [ogImageUploadError, setOgImageUploadError] = useState('')
  const [ogImageUploadPreviewUrl, setOgImageUploadPreviewUrl] = useState('')
  const previewImgRef = useRef(null)
  const detailRequestIdRef = useRef(0)

  const { clearAll, getFieldError, validateField, validateMany } = useFormValidation()

  const isDirty = useMemo(() => {
    const current = JSON.stringify(form?.seo ?? {})
    const baseline = JSON.stringify(selectedTargetDetail?.seo ?? {})
    return current !== baseline
  }, [form, selectedTargetDetail])

  const previewCanonicalPath = String(form?.seo?.canonicalPath ?? '/').trim() || '/'
  const previewHost = 'www.idtechproducts.com'
  const previewUrlText = `${previewHost}${previewCanonicalPath.startsWith('/') ? previewCanonicalPath : `/${previewCanonicalPath}`}`
  const fieldSource = selectedTargetDetail?.fieldSource ?? {}
  const sourceBadgeClass = (value) =>
    value === 'explicit'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700'
  const renderLabelWithSource = (label, sourceKey) => (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[11px] ${sourceBadgeClass(fieldSource[sourceKey])}`}>
        {fieldSource[sourceKey] === 'explicit' ? 'Explicit' : 'Fallback'}
      </span>
    </span>
  )

  const syncPreviewAfterBlur = () => {
    const nextUrl = String(form?.seo?.ogImageUrl ?? '').trim()
    setPreviewUrl(nextUrl)
    if (!nextUrl) {
      setPreviewState('idle')
      return
    }
    setPreviewState('loading')
  }

  const clearOgImageUploadSelection = () => {
    if (ogImageUploadPreviewUrl) {
      window.URL.revokeObjectURL(ogImageUploadPreviewUrl)
    }
    setOgImageUploadPreviewUrl('')
    setOgImageUploadFile(null)
    setOgImageUploadError('')
  }

  const handleOgImageModeChange = (mode) => {
    if (mode === ogImageInputMode) return
    setOgImageInputMode(mode)
    if (mode === 'url') {
      clearOgImageUploadSelection()
      return
    }
    updateSeoField('ogImageUrl', '')
  }

  const handleOgImageFileChange = (file) => {
    if (ogImageUploadPreviewUrl) {
      window.URL.revokeObjectURL(ogImageUploadPreviewUrl)
    }
    if (!file) {
      setOgImageUploadPreviewUrl('')
      setOgImageUploadFile(null)
      setOgImageUploadError('')
      return
    }
    setOgImageUploadPreviewUrl(window.URL.createObjectURL(file))
    setOgImageUploadFile(file)
    setOgImageUploadError('')
  }

  const updateSeoField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      seo: {
        ...(prev?.seo ?? {}),
        [field]: value,
      },
    }))
  }

  const validateByFieldName = (fieldName) => {
    validateField(fieldName, () => validateSchemaField(seoEditorSchema, form, fieldName))
  }

  const applyTargetDetail = (detail) => {
    setSelectedTargetDetail(detail)
    setForm({ seo: { ...(detail?.seo ?? createEmptyForm().seo) } })
    setOgImageInputMode('url')
    clearOgImageUploadSelection()
    clearAll()
    setValidationErrors([])

    const initialPreviewUrl = String(detail?.seo?.ogImageUrl ?? '').trim()
    const shouldKeepLoaded = previewState === 'loaded' && previewUrl === initialPreviewUrl
    setPreviewUrl(initialPreviewUrl)
    setPreviewState(initialPreviewUrl ? (shouldKeepLoaded ? 'loaded' : 'idle') : 'idle')
  }

  const loadSelectedTargetDetail = async (targetKey) => {
    const requestId = detailRequestIdRef.current + 1
    detailRequestIdRef.current = requestId

    setOgImageInputMode('url')
    clearOgImageUploadSelection()

    if (!targetKey) {
      setSelectedTargetDetail(null)
      setForm(createEmptyForm())
      setPreviewUrl('')
      setPreviewState('idle')
      setStatus('idle')
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setSuccessMessage('')
    setPreviewUrl('')
    setPreviewState('idle')

    try {
      const payload = await fetchBackstageSeoTargetDetail(targetKey)
      if (requestId !== detailRequestIdRef.current) return
      const detail = payload?.data?.target
      if (!detail) throw new Error('SEO target detail is empty.')
      applyTargetDetail(detail)
      setStatus('success')
    } catch (error) {
      if (requestId !== detailRequestIdRef.current) return
      setStatus('error')
      setErrorMessage(error?.message || 'Unable to load SEO target detail.')
    }
  }

  useEffect(() => {
    loadSelectedTargetDetail(selectedTargetKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTargetKey])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('seo-editor:dirty-change', {
        detail: { isDirty, targetKey: selectedTargetKey || '' },
      }),
    )
  }, [isDirty, selectedTargetKey])

  useEffect(
    () => () => {
      window.dispatchEvent(
        new CustomEvent('seo-editor:dirty-change', {
          detail: { isDirty: false, targetKey: '' },
        }),
      )
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (ogImageUploadPreviewUrl) {
        window.URL.revokeObjectURL(ogImageUploadPreviewUrl)
      }
    }
  }, [ogImageUploadPreviewUrl])

  const validateBeforeSave = () => {
    const validationForm = {
      ...form,
      seo: {
        ...form.seo,
        ogImageUrl:
          ogImageInputMode === 'upload' && ogImageUploadFile && !form?.seo?.ogImageUrl
            ? 'https://upload.pending.local/seo-og.webp'
            : form?.seo?.ogImageUrl,
      },
    }
    const validation = validateSchema(seoEditorSchema, validationForm)
    const fieldValidators = seoEditorSchema.map((item) => ({
      name: item.name,
      validate: () => validateSchemaField(seoEditorSchema, validationForm, item.name),
    }))
    validateMany(fieldValidators)
    setValidationErrors(validation.errors)
    return validation.valid
  }

  const notifySeoTargetsChanged = () => {
    window.dispatchEvent(new CustomEvent('seo-targets:refresh'))
  }

  const save = async () => {
    if (!selectedTargetKey) return
    if (!validateBeforeSave()) {
      setErrorMessage('Please fix the validation errors before saving.')
      setSuccessMessage('')
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      let resolvedOgImageUrl = String(form?.seo?.ogImageUrl ?? '').trim()
      if (ogImageInputMode === 'upload') {
        if (!ogImageUploadFile) {
          setOgImageUploadError('Please choose an image file before saving.')
          setStatus('error')
          return
        }
        const uploadResponse = await uploadBackstageImage({
          file: ogImageUploadFile,
          category: 'seo',
          updatedBy: editorId,
        })
        resolvedOgImageUrl = String(uploadResponse?.data?.url ?? '').trim()
      }
      const result = await updateBackstageSeoTarget(selectedTargetKey, {
        seo: { ...(form?.seo ?? {}), ogImageUrl: resolvedOgImageUrl },
        updatedBy: editorId,
      })
      const responseTarget = result?.data?.target ?? null

      await loadSelectedTargetDetail(selectedTargetKey)
      notifySeoTargetsChanged()

      setStatus('success')
      setSuccessMessage(`SEO saved for ${responseTarget?.targetKey ?? selectedTargetKey}.`)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error?.message || 'Unable to save SEO.')
    }
  }

  const resetToLastSaved = () => {
    if (!selectedTargetDetail) return
    applyTargetDetail(selectedTargetDetail)
    setSuccessMessage('Changes reverted to last saved state.')
    setErrorMessage('')
  }

  const resetToFallback = async () => {
    if (!selectedTargetKey) return

    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await resetBackstageSeoTargetFallback(selectedTargetKey, { updatedBy: editorId })
      await loadSelectedTargetDetail(selectedTargetKey)
      notifySeoTargetsChanged()
      setStatus('success')
      setSuccessMessage(`SEO reset to fallback for ${selectedTargetKey}.`)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error?.message || 'Unable to reset SEO to fallback.')
    }
  }

  if (!selectedTargetKey) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Select a SEO target from the sidebar.
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <StatusMessage tone="error" message={errorMessage}>
        {validationErrors.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
            {validationErrors.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : null}
      </StatusMessage>
      <StatusMessage tone="success" message={successMessage} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">SEO Manager</h1>
            <p className="mt-1 text-xs text-slate-500">{selectedTargetDetail?.targetKey ?? selectedTargetKey}</p>
            {selectedTargetDetail?.updatedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                Last updated: {selectedTargetDetail.updatedAt}
                {selectedTargetDetail?.updatedBy ? ` by ${selectedTargetDetail.updatedBy}` : ''}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetToLastSaved}
              disabled={!isDirty}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset to Last Saved
            </button>
            <button
              type="button"
              onClick={() => setIsResetFallbackConfirmOpen(true)}
              className="rounded-md border border-amber-300 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
            >
              Reset to Fallback
            </button>
            <button
              type="button"
              onClick={save}
              disabled={status === 'saving' || status === 'loading' || !selectedTargetDetail}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'saving' ? 'Saving...' : 'Save SEO'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={renderLabelWithSource('Page Title', 'title')} required className="md:col-span-2" error={getFieldError('seo.title')}>
              <input
                value={form.seo.title}
                onChange={(event) => updateSeoField('title', event.target.value)}
                onBlur={() => validateByFieldName('seo.title')}
                placeholder="Enter SEO title"
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField label={renderLabelWithSource('Meta Description', 'description')} required className="md:col-span-2" error={getFieldError('seo.description')}>
              <textarea
                value={form.seo.description}
                onChange={(event) => updateSeoField('description', event.target.value)}
                onBlur={() => validateByFieldName('seo.description')}
                placeholder="Enter SEO description"
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField label={renderLabelWithSource('Canonical Path', 'canonicalPath')} required error={getFieldError('seo.canonicalPath')}>
              <input
                value={form.seo.canonicalPath}
                onChange={(event) => updateSeoField('canonicalPath', event.target.value)}
                onBlur={() => validateByFieldName('seo.canonicalPath')}
                placeholder="/products/vp3300"
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField label={renderLabelWithSource('Type', 'type')} required error={getFieldError('seo.type')}>
              <DropdownSelect
                value={form.seo.type}
                options={SEO_TYPE_OPTIONS.map((value) => ({ value, label: value }))}
                onChange={(nextValue) => updateSeoField('type', nextValue || 'website')}
                onBlur={() => validateByFieldName('seo.type')}
                placeholder="Select SEO type"
              />
            </FormField>

            <ImageSourceInputField
              label="OG Image URL"
              className="md:col-span-2"
              mode={ogImageInputMode}
              onModeChange={handleOgImageModeChange}
              urlValue={form.seo.ogImageUrl}
              onUrlChange={(nextValue) => updateSeoField('ogImageUrl', nextValue)}
              onUrlBlur={() => {
                syncPreviewAfterBlur()
                validateByFieldName('seo.ogImageUrl')
              }}
              urlError={getFieldError('seo.ogImageUrl')}
              uploadFile={ogImageUploadFile}
              onUploadFileChange={handleOgImageFileChange}
              onClearUploadFile={clearOgImageUploadSelection}
              uploadError={ogImageUploadError}
            />

            <div className="md:col-span-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">Image Preview</p>
              {!(ogImageInputMode === 'upload' && ogImageUploadPreviewUrl) && !previewUrl ? (
                <div className="flex h-36 w-36 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-xs text-slate-500">
                  No image URL
                </div>
              ) : (
                <div className="relative h-36 w-36 overflow-hidden rounded-md border border-slate-200 bg-white">
                  {previewState === 'error' ? (
                    <div className="flex h-full w-full items-center justify-center text-xs text-rose-600">
                      Image failed to load
                    </div>
                  ) : null}
                  <img
                    ref={previewImgRef}
                    src={
                      ogImageInputMode === 'upload' && ogImageUploadPreviewUrl
                        ? ogImageUploadPreviewUrl
                        : previewUrl
                    }
                    alt="SEO OG preview"
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

            <div className="md:col-span-2 grid items-start gap-4 md:grid-cols-2">
              <FormField label={renderLabelWithSource('Noindex', 'noindex')}>
                <div className="flex h-10 w-full items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.seo.noindex)}
                    onChange={(event) => {
                      const checked = event.target.checked
                      updateSeoField('noindex', checked)
                      updateSeoField('robots', checked ? 'noindex,nofollow' : 'index,follow')
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="leading-none">Exclude from indexing</span>
                </div>
              </FormField>

              <FormField label={renderLabelWithSource('Robots', 'robots')} required error={getFieldError('seo.robots')}>
                <DropdownSelect
                  value={form.seo.robots}
                  options={ROBOTS_OPTIONS.map((value) => ({ value, label: value }))}
                  onChange={(nextValue) => updateSeoField('robots', nextValue || 'index,follow')}
                  onBlur={() => validateByFieldName('seo.robots')}
                  placeholder="Select robots"
                />
              </FormField>
            </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Search Preview</h3>
            <div className="inline-flex rounded-md border border-slate-300 bg-white p-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`rounded px-2 py-1 ${previewViewport === 'desktop' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`rounded px-2 py-1 ${previewViewport === 'mobile' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
              >
                Mobile
              </button>
            </div>
          </div>

          <div className={`space-y-3 rounded-lg border border-slate-200 bg-white p-3 ${previewViewport === 'mobile' ? 'max-w-[320px]' : ''}`}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Google-style preview</p>
            <div className="space-y-1">
              <p className="truncate text-xs text-slate-500">{previewUrlText}</p>
              <p className="line-clamp-2 text-[20px] leading-6 text-[#1a0dab]">
                {form.seo.title || 'Page title preview'}
              </p>
              <p className="line-clamp-3 text-[14px] leading-5 text-[#4d5156]">
                {form.seo.description || 'Meta description preview'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              Preview is approximate and may differ from real Google rendering.
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Open Graph preview</p>
            <div className="overflow-hidden rounded-md border border-slate-200">
              {previewUrl ? (
                <img src={previewUrl} alt="Open graph preview" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-slate-50 text-xs text-slate-500">
                  No image URL
                </div>
              )}
              <div className="space-y-1 bg-white p-3">
                <p className="line-clamp-2 text-sm font-semibold text-slate-900">{form.seo.title || 'Page title preview'}</p>
                <p className="line-clamp-2 text-xs text-slate-500">{form.seo.description || 'Meta description preview'}</p>
                <p className="truncate text-[11px] uppercase text-slate-400">{previewHost}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-500">
            <p>Title: {String(form.seo.title ?? '').length} / 60</p>
            <p>Description: {String(form.seo.description ?? '').length} / 160</p>
            <p>
              Source: <span className="font-medium text-slate-700">{selectedTargetDetail?.sourceState ?? '-'}</span>
            </p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={isResetFallbackConfirmOpen}
        title="Reset SEO to Fallback?"
        description="This will remove explicit SEO fields for the selected target and use system fallback values."
        confirmLabel="Reset"
        onConfirm={() => {
          setIsResetFallbackConfirmOpen(false)
          resetToFallback()
        }}
        onCancel={() => setIsResetFallbackConfirmOpen(false)}
      />
    </section>
  )
}

export default SeoManagerPage
