import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import FormField from '../../common/FormField'
import DropdownSelect from '../../common/DropdownSelect'
import StatusMessage from '../../common/StatusMessage'
import ImageSourceInputField from '../../common/ImageSourceInputField'
import useFormValidation from '../../../hooks/useFormValidation'
import {
  createBackstageProduct,
  fetchBackstageProductBySlug,
  updateBackstageProduct,
} from '../../../api/backstageContentProductsApi'
import { uploadBackstageImage } from '../../../api/backstageUploadsApi'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import { buildProductEditorValidationSchema } from './ProductEditorPage.schema'

const buildInitialForm = () => ({
  name: '',
  shortDescription: '',
  status: 'active',
  media: { heroImageUrl: '' },
  detail: { heroEyebrow: '', heroDescription: '', heroImageUrl: '' },
  downloads: { datasheetName: '', datasheetUrl: '', datasheetMimeType: 'application/pdf' },
})

const ProductEditorPage = ({ mode }) => {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user } = useAuth()
  const { clearAll, getFieldError, validateField } = useFormValidation()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [currentSlug, setCurrentSlug] = useState(slug ?? '')
  const [form, setForm] = useState(buildInitialForm)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState('')
  const [heroPreviewState, setHeroPreviewState] = useState('idle')
  const previewBlurTimerRef = useRef(null)
  const previewImgRef = useRef(null)
  const [mediaImageInputMode, setMediaImageInputMode] = useState('url')
  const [mediaImageUploadFile, setMediaImageUploadFile] = useState(null)
  const [mediaImageUploadError, setMediaImageUploadError] = useState('')
  const [mediaImageUploadPreviewUrl, setMediaImageUploadPreviewUrl] = useState('')
  const [detailImageInputMode, setDetailImageInputMode] = useState('url')
  const [detailImageUploadFile, setDetailImageUploadFile] = useState(null)
  const [detailImageUploadError, setDetailImageUploadError] = useState('')
  const validationSchema = useMemo(() => buildProductEditorValidationSchema(form), [form])

  const validateByFieldName = (fieldName) =>
    validateField(fieldName, () => validateSchemaField(validationSchema, form, fieldName))

  useEffect(() => {
    if (mode !== 'edit' || !slug) return

    const load = async () => {
      setStatus('loading')
      setErrorMessage('')
      setValidationErrors([])

      try {
        const payload = await fetchBackstageProductBySlug(slug)
        const product = payload?.data?.product
        if (!product) throw new Error('Product not found')

        setCurrentSlug(product.slug)
        setForm({
          name: product.name ?? '',
          shortDescription: product.shortDescription ?? '',
          status: product.status ?? 'active',
          media: { heroImageUrl: product.media?.heroImageUrl ?? '' },
          detail: {
            heroEyebrow: product.detail?.heroEyebrow ?? '',
            heroDescription: product.detail?.heroDescription ?? '',
            heroImageUrl: product.detail?.heroImageUrl ?? '',
          },
          downloads: {
            datasheetName: product.downloads?.datasheetName ?? '',
            datasheetUrl: product.downloads?.datasheetUrl ?? '',
            datasheetMimeType: product.downloads?.datasheetMimeType ?? 'application/pdf',
          },
        })
        const nextPreview = product.media?.heroImageUrl ?? ''
        setHeroPreviewUrl(nextPreview)
        if (!nextPreview) {
          setHeroPreviewState('idle')
        }

        setStatus('success')
        clearAll()
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load product')
      }
    }

    load()
  }, [clearAll, mode, slug])

  useEffect(() => {
    return () => {
      if (previewBlurTimerRef.current) {
        clearTimeout(previewBlurTimerRef.current)
      }
      if (mediaImageUploadPreviewUrl) {
        window.URL.revokeObjectURL(mediaImageUploadPreviewUrl)
      }
    }
  }, [mediaImageUploadPreviewUrl])

  useEffect(() => {
    if (!heroPreviewUrl) {
      setHeroPreviewState('idle')
      return
    }

    setHeroPreviewState('loading')
    const immediateImg = previewImgRef.current
    if (immediateImg?.complete) {
      if (immediateImg.naturalWidth > 0) {
        setHeroPreviewState('loaded')
      } else {
        setHeroPreviewState('error')
      }
      return
    }

    let isCancelled = false
    const probe = new Image()
    const fallbackTimerId = window.setTimeout(() => {
      if (isCancelled) return
      const fallbackImg = previewImgRef.current
      if (fallbackImg?.complete && fallbackImg.naturalWidth > 0) {
        setHeroPreviewState('loaded')
      } else if (fallbackImg?.complete && fallbackImg.naturalWidth === 0) {
        setHeroPreviewState('error')
      }
    }, 1200)

    probe.onload = () => {
      if (isCancelled) return
      setHeroPreviewState('loaded')
    }

    probe.onerror = () => {
      if (isCancelled) return
      setHeroPreviewState('error')
    }

    probe.src = heroPreviewUrl

    return () => {
      isCancelled = true
      window.clearTimeout(fallbackTimerId)
      probe.onload = null
      probe.onerror = null
    }
  }, [heroPreviewUrl])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (group, field, value) => {
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] ?? {}),
        [field]: value,
      },
    }))
  }

  const clearMediaUploadSelection = () => {
    if (mediaImageUploadPreviewUrl) {
      window.URL.revokeObjectURL(mediaImageUploadPreviewUrl)
    }
    setMediaImageUploadFile(null)
    setMediaImageUploadPreviewUrl('')
    setMediaImageUploadError('')
  }

  const clearDetailUploadSelection = () => {
    setDetailImageUploadFile(null)
    setDetailImageUploadError('')
  }

  const handleMediaImageModeChange = (mode) => {
    if (mode === mediaImageInputMode) return
    setMediaImageInputMode(mode)
    if (mode === 'url') {
      clearMediaUploadSelection()
      return
    }
    updateNestedField('media', 'heroImageUrl', '')
  }

  const handleDetailImageModeChange = (mode) => {
    if (mode === detailImageInputMode) return
    setDetailImageInputMode(mode)
    if (mode === 'url') {
      clearDetailUploadSelection()
      return
    }
    updateNestedField('detail', 'heroImageUrl', '')
  }

  const handleMediaImageFileChange = (file) => {
    if (mediaImageUploadPreviewUrl) {
      window.URL.revokeObjectURL(mediaImageUploadPreviewUrl)
    }
    if (!file) {
      setMediaImageUploadFile(null)
      setMediaImageUploadPreviewUrl('')
      setMediaImageUploadError('')
      return
    }
    setMediaImageUploadFile(file)
    setMediaImageUploadPreviewUrl(window.URL.createObjectURL(file))
    setMediaImageUploadError('')
  }

  const handleDetailImageFileChange = (file) => {
    if (!file) {
      setDetailImageUploadFile(null)
      setDetailImageUploadError('')
      return
    }
    setDetailImageUploadFile(file)
    setDetailImageUploadError('')
  }

  const syncHeroPreviewAfterBlur = () => {
    if (previewBlurTimerRef.current) {
      clearTimeout(previewBlurTimerRef.current)
    }

    previewBlurTimerRef.current = setTimeout(() => {
      const nextPreview = form.media.heroImageUrl?.trim() ?? ''
      if (!nextPreview) {
        setHeroPreviewUrl('')
        setHeroPreviewState('idle')
        return
      }

      if (nextPreview === heroPreviewUrl) {
        return
      }

      setHeroPreviewUrl(nextPreview)
    }, 500)
  }

  const submit = async (event) => {
    event.preventDefault()
    const validationForm = {
      ...form,
      media: {
        ...form.media,
        heroImageUrl:
          mediaImageInputMode === 'upload' && mediaImageUploadFile && !form.media.heroImageUrl
            ? 'https://upload.pending.local/media-hero.webp'
            : form.media.heroImageUrl,
      },
      detail: {
        ...form.detail,
        heroImageUrl:
          detailImageInputMode === 'upload' && detailImageUploadFile && !form.detail.heroImageUrl
            ? 'https://upload.pending.local/detail-hero.webp'
            : form.detail.heroImageUrl,
      },
    }

    const validation = validateSchema(validationSchema, validationForm)
    if (!validation.valid) {
      setStatus('error')
      setErrorMessage('Please fix the validation errors before saving.')
      setValidationErrors(validation.errors)
      setSuccessMessage('')
      return
    }

    if (mediaImageInputMode === 'upload' && !mediaImageUploadFile) {
      setMediaImageUploadError('Please choose an image file before saving.')
      setStatus('error')
      return
    }
    if (detailImageInputMode === 'upload' && !detailImageUploadFile) {
      setDetailImageUploadError('Please choose an image file before saving.')
      setStatus('error')
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setValidationErrors([])
    setSuccessMessage('')

    try {
      let resolvedMediaHeroUrl = String(form.media.heroImageUrl ?? '').trim()
      let resolvedDetailHeroUrl = String(form.detail.heroImageUrl ?? '').trim()
      if (mediaImageInputMode === 'upload' && mediaImageUploadFile) {
        const uploadResponse = await uploadBackstageImage({
          file: mediaImageUploadFile,
          category: 'products/media-hero',
          updatedBy: editorId,
        })
        resolvedMediaHeroUrl = String(uploadResponse?.data?.url ?? '').trim()
      }
      if (detailImageInputMode === 'upload' && detailImageUploadFile) {
        const uploadResponse = await uploadBackstageImage({
          file: detailImageUploadFile,
          category: 'products/detail-hero',
          updatedBy: editorId,
        })
        resolvedDetailHeroUrl = String(uploadResponse?.data?.url ?? '').trim()
      }
      const payload = {
        ...form,
        media: { ...form.media, heroImageUrl: resolvedMediaHeroUrl },
        detail: { ...form.detail, heroImageUrl: resolvedDetailHeroUrl },
        updatedBy: editorId,
      }

      if (mode === 'create') {
        await createBackstageProduct(payload)
        navigate('/pages/content/products', { replace: true })
        return
      } else {
        await updateBackstageProduct(slug, payload)
        navigate('/pages/content/products', { replace: true })
        return
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save product')
    }
  }

  const isBusy = status === 'loading' || status === 'saving'

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {mode === 'create' ? 'Create Product' : 'Edit Product'}
            </h1>
          </div>
          <Link
            to="/pages/content/products"
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
      <StatusMessage tone="success" message={successMessage} />

      <form onSubmit={submit} className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Basic</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Name" required error={getFieldError('name')}>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                onBlur={() => validateByFieldName('name')}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField label="Slug">
              <input
                value={mode === 'edit' ? currentSlug : '(Auto generated after create)'}
                readOnly
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500"
              />
            </FormField>

            <FormField
              label="Short Description"
              required
              className="md:col-span-2"
              error={getFieldError('shortDescription')}
            >
              <textarea
                rows={3}
                value={form.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                onBlur={() => validateByFieldName('shortDescription')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField
              label="Status"
              className="md:max-w-[220px]"
              error={getFieldError('status')}
            >
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
          <h2 className="text-base font-semibold text-slate-900">Media</h2>
          <div className="mt-4 grid gap-4">
            <ImageSourceInputField
              label="Hero Image URL"
              required
              mode={mediaImageInputMode}
              onModeChange={handleMediaImageModeChange}
              urlValue={form.media.heroImageUrl}
              onUrlChange={(nextValue) => updateNestedField('media', 'heroImageUrl', nextValue)}
              onUrlBlur={() => {
                syncHeroPreviewAfterBlur()
                validateByFieldName('media.heroImageUrl')
              }}
              urlError={getFieldError('media.heroImageUrl')}
              uploadFile={mediaImageUploadFile}
              onUploadFileChange={handleMediaImageFileChange}
              onClearUploadFile={clearMediaUploadSelection}
              uploadError={mediaImageUploadError}
            />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-700">Background Preview</p>
              {!(mediaImageInputMode === 'upload' && mediaImageUploadPreviewUrl) && !heroPreviewUrl ? (
                <div className="flex h-36 w-36 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                  No image URL
                </div>
              ) : (
                <div className="relative h-36 w-36 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {heroPreviewState === 'error' ? (
                    <div className="flex h-full w-full items-center justify-center text-xs text-rose-600">
                      Image failed to load
                    </div>
                  ) : null}
                  <img
                    ref={previewImgRef}
                    src={
                      mediaImageInputMode === 'upload' && mediaImageUploadPreviewUrl
                        ? mediaImageUploadPreviewUrl
                        : heroPreviewUrl
                    }
                    alt="Hero preview"
                    className={`h-full w-full object-cover ${heroPreviewState === 'error' ? 'hidden' : ''}`}
                    onLoad={() => setHeroPreviewState('loaded')}
                    onError={() => setHeroPreviewState('error')}
                  />
                  {heroPreviewState === 'loading' ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-slate-600">
                      Loading preview...
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Detail</h2>
          <div className="mt-4 grid gap-4">
            <FormField label="Hero Eyebrow" required error={getFieldError('detail.heroEyebrow')}>
              <input
                value={form.detail.heroEyebrow}
                onChange={(event) => updateNestedField('detail', 'heroEyebrow', event.target.value)}
                onBlur={() => validateByFieldName('detail.heroEyebrow')}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>
            <FormField
              label="Hero Description"
              required
              error={getFieldError('detail.heroDescription')}
            >
              <textarea
                rows={3}
                value={form.detail.heroDescription}
                onChange={(event) => updateNestedField('detail', 'heroDescription', event.target.value)}
                onBlur={() => validateByFieldName('detail.heroDescription')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </FormField>
            <ImageSourceInputField
              label="Detail Hero Image URL"
              required
              mode={detailImageInputMode}
              onModeChange={handleDetailImageModeChange}
              urlValue={form.detail.heroImageUrl}
              onUrlChange={(nextValue) => updateNestedField('detail', 'heroImageUrl', nextValue)}
              onUrlBlur={() => validateByFieldName('detail.heroImageUrl')}
              urlError={getFieldError('detail.heroImageUrl')}
              uploadFile={detailImageUploadFile}
              onUploadFileChange={handleDetailImageFileChange}
              onClearUploadFile={clearDetailUploadSelection}
              uploadError={detailImageUploadError}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Downloads</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <FormField label="Datasheet Name" error={getFieldError('downloads.datasheetName')}>
              <input
                value={form.downloads.datasheetName}
                onChange={(event) => updateNestedField('downloads', 'datasheetName', event.target.value)}
                onBlur={() => validateByFieldName('downloads.datasheetName')}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>
            <FormField
              label="Datasheet URL"
              className="md:col-span-2"
              error={getFieldError('downloads.datasheetUrl')}
            >
              <input
                value={form.downloads.datasheetUrl}
                onChange={(event) => updateNestedField('downloads', 'datasheetUrl', event.target.value)}
                onBlur={() => validateByFieldName('downloads.datasheetUrl')}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>
            <FormField
              label="Datasheet Mime Type"
              className="md:max-w-[220px]"
              error={getFieldError('downloads.datasheetMimeType')}
            >
              <input
                value={form.downloads.datasheetMimeType}
                onChange={(event) => updateNestedField('downloads', 'datasheetMimeType', event.target.value)}
                onBlur={() => validateByFieldName('downloads.datasheetMimeType')}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <Link
            to="/pages/content/products"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ProductEditorPage
