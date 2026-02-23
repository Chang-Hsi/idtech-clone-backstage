import { useEffect, useRef, useState } from 'react'
import ImageSourceInputField from '../../common/ImageSourceInputField'
import { uploadBackstageImage } from '../../../api/backstageUploadsApi'
import useFormValidation from '../../../hooks/useFormValidation'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import { buildBannerHubRowEditorSchema } from './BannerHubRowEditorDrawer.schema'

const BannerHubRowEditorDrawer = ({
  isOpen,
  tab,
  item,
  onClose,
  onApply,
}) => {
  const { getFieldError, validateField, validateMany, clearAll } = useFormValidation()
  const [draft, setDraft] = useState(() => item)
  const [previewUrl, setPreviewUrl] = useState(() => item?.backgroundImageUrl?.trim() ?? '')
  const [previewState, setPreviewState] = useState(() =>
    item?.backgroundImageUrl?.trim() ? 'loading' : 'idle'
  )
  const [imageInputMode, setImageInputMode] = useState('url')
  const [imageUploadFile, setImageUploadFile] = useState(null)
  const [imageUploadError, setImageUploadError] = useState('')
  const [imageUploadPreviewUrl, setImageUploadPreviewUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const blurTimerRef = useRef(null)
  const validationSchema = buildBannerHubRowEditorSchema({ tab })

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current)
      }
      if (imageUploadPreviewUrl) {
        window.URL.revokeObjectURL(imageUploadPreviewUrl)
      }
    }
  }, [imageUploadPreviewUrl])

  if (!isOpen || !draft) return null

  const update = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const clearImageUploadSelection = () => {
    if (imageUploadPreviewUrl) {
      window.URL.revokeObjectURL(imageUploadPreviewUrl)
    }
    setImageUploadFile(null)
    setImageUploadPreviewUrl('')
    setImageUploadError('')
  }

  const handleImageModeChange = (mode) => {
    if (mode === imageInputMode) return
    setImageInputMode(mode)
    if (mode === 'url') {
      clearImageUploadSelection()
      return
    }
    update('backgroundImageUrl', '')
  }

  const handleImageUploadFileChange = (file) => {
    if (imageUploadPreviewUrl) {
      window.URL.revokeObjectURL(imageUploadPreviewUrl)
    }
    if (!file) {
      setImageUploadFile(null)
      setImageUploadPreviewUrl('')
      setImageUploadError('')
      return
    }
    setImageUploadFile(file)
    setImageUploadPreviewUrl(window.URL.createObjectURL(file))
    setImageUploadError('')
  }

  const apply = async () => {
    const validationDraft =
      tab === 'detail' || tab === 'product'
        ? {
            ...draft,
            backgroundImageUrl:
              imageInputMode === 'upload'
                ? imageUploadFile
                  ? 'https://placeholder.local/upload.webp'
                  : ''
                : draft.backgroundImageUrl,
          }
        : draft
    const quickValid = validateMany(
      validationSchema.map((field) => ({
        name: field.name,
        validate: () => validateSchemaField(validationSchema, validationDraft, field.name),
      }))
    )
    const validation = validateSchema(validationSchema, validationDraft)
    if (!quickValid || !validation.valid) {
      setErrorMessage('Please fix validation errors before apply.')
      setValidationErrors(validation.errors)
      return
    }

    let resolvedBackgroundImageUrl = validationDraft.backgroundImageUrl
    if ((tab === 'detail' || tab === 'product') && imageInputMode === 'upload' && imageUploadFile) {
      try {
        const uploaded = await uploadBackstageImage(imageUploadFile)
        const uploadedUrl = String(uploaded?.data?.url ?? '').trim()
        if (!uploadedUrl) throw new Error('Image upload succeeded but no URL was returned.')
        resolvedBackgroundImageUrl = uploadedUrl
        setImageUploadError('')
      } catch (error) {
        setErrorMessage(error.message || 'Unable to upload image.')
        setImageUploadError(error.message || 'Unable to upload image.')
        return
      }
    }

    setErrorMessage('')
    setValidationErrors([])
    clearAll()
    onApply({
      ...validationDraft,
      backgroundImageUrl: resolvedBackgroundImageUrl,
    })
  }

  const syncPreviewAfterBlur = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current)
    }

    blurTimerRef.current = setTimeout(() => {
      const next = draft.backgroundImageUrl?.trim() ?? ''
      setPreviewUrl(next)
      setPreviewState(next ? 'loading' : 'idle')
    }, 500)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/25"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="slide-right-in h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl"
        style={{ '--anim-distance': '48px', '--anim-duration': '220ms' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Edit Banner Row</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          <p>{draft.label ?? draft.slug ?? draft.pageKey}</p>
          <p className="mt-1">{draft.pageKey}</p>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              Eyebrow<span className="ml-1 text-red-500">*</span>
            </span>
            <input
              value={draft.eyebrow ?? ''}
              onChange={(event) => update('eyebrow', event.target.value)}
              onBlur={() => validateField('eyebrow', () => validateSchemaField(validationSchema, draft, 'eyebrow'))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
            {getFieldError('eyebrow') ? <p className="text-xs text-red-600">{getFieldError('eyebrow')}</p> : null}
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              Title<span className="ml-1 text-red-500">*</span>
            </span>
            <input
              value={draft.title ?? ''}
              onChange={(event) => update('title', event.target.value)}
              onBlur={() => validateField('title', () => validateSchemaField(validationSchema, draft, 'title'))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
            {getFieldError('title') ? <p className="text-xs text-red-600">{getFieldError('title')}</p> : null}
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              Description<span className="ml-1 text-red-500">*</span>
            </span>
            <textarea
              rows={4}
              value={draft.description ?? ''}
              onChange={(event) => update('description', event.target.value)}
              onBlur={() =>
                validateField('description', () =>
                  validateSchemaField(validationSchema, draft, 'description')
                )
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
            {getFieldError('description') ? (
              <p className="text-xs text-red-600">{getFieldError('description')}</p>
            ) : null}
          </label>

          {tab === 'detail' || tab === 'product' ? (
            <ImageSourceInputField
              label="Background Image URL"
              mode={imageInputMode}
              onModeChange={handleImageModeChange}
              urlValue={draft.backgroundImageUrl ?? ''}
              onUrlChange={(value) => update('backgroundImageUrl', value)}
              onUrlBlur={() => {
                syncPreviewAfterBlur()
                validateField('backgroundImageUrl', () =>
                  validateSchemaField(validationSchema, draft, 'backgroundImageUrl')
                )
              }}
              urlError={getFieldError('backgroundImageUrl')}
              uploadFile={imageUploadFile}
              onUploadFileChange={handleImageUploadFileChange}
              onClearUploadFile={clearImageUploadSelection}
              uploadError={imageUploadError}
              required
            />
          ) : null}

          {tab === 'detail' || tab === 'product' ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-700">Background Preview</p>
              {imageInputMode === 'upload' && imageUploadPreviewUrl ? (
                <div className="relative overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  <img src={imageUploadPreviewUrl} alt="Background upload preview" className="h-32 w-full object-cover" />
                </div>
              ) : !previewUrl ? (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                  No image URL
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {previewState === 'error' ? (
                    <div className="flex h-32 items-center justify-center text-xs text-rose-600">
                      Image failed to load
                    </div>
                  ) : null}
                  <img
                    src={previewUrl}
                    alt="Background preview"
                    className={`h-32 w-full object-cover ${previewState === 'error' ? 'hidden' : ''}`}
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
          ) : null}

          {tab === 'product' ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Datasheet Name</span>
              <input
                value={draft.datasheetName ?? ''}
                onChange={(event) => update('datasheetName', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>
          ) : null}

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          {validationErrors.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-red-600">
              {validationErrors.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={apply}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  )
}

export default BannerHubRowEditorDrawer
