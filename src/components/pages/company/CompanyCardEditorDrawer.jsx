import { useEffect, useMemo, useRef, useState } from 'react'
import DropdownSelect from '../../common/DropdownSelect'
import FormField from '../../common/FormField'
import StatusMessage from '../../common/StatusMessage'
import useFormValidation from '../../../hooks/useFormValidation'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import { buildCompanyCardEditorSchema } from './CompanyCardEditorDrawer.schema'

const CLOSE_ANIMATION_MS = 220

const buildInitialDraft = (card) => ({
  id: card?.id ?? '',
  title: card?.title ?? '',
  description: card?.description ?? '',
  to: card?.to ?? '',
  imageUrl: card?.imageUrl ?? '',
  status: card?.status === 'archived' ? 'archived' : 'active',
})

const CompanyCardEditorDrawer = ({ isOpen, mode, card, onClose, onSave, isSaving = false }) => {
  const { getFieldError, validateField, validateMany } = useFormValidation()
  const initialDraft = useMemo(() => buildInitialDraft(card), [card])
  const [draft, setDraft] = useState(initialDraft)
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [isClosing, setIsClosing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(initialDraft.imageUrl)
  const [previewState, setPreviewState] = useState(initialDraft.imageUrl ? 'loading' : 'idle')
  const previewBlurTimerRef = useRef(null)
  const validationSchema = useMemo(() => buildCompanyCardEditorSchema(), [])

  useEffect(() => {
    return () => {
      if (previewBlurTimerRef.current) clearTimeout(previewBlurTimerRef.current)
    }
  }, [])

  if (!isOpen) return null

  const update = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const syncPreviewAfterBlur = () => {
    if (previewBlurTimerRef.current) clearTimeout(previewBlurTimerRef.current)

    previewBlurTimerRef.current = setTimeout(() => {
      const nextPreview = draft.imageUrl?.trim() ?? ''
      if (!nextPreview) {
        setPreviewUrl('')
        setPreviewState('idle')
        return
      }
      if (nextPreview === previewUrl) return
      setPreviewUrl(nextPreview)
      setPreviewState('loading')
    }, 500)
  }

  const handleRequestClose = () => {
    setIsClosing(true)
    window.setTimeout(() => onClose(), CLOSE_ANIMATION_MS)
  }

  const handleSave = () => {
    const quickValid = validateMany(
      validationSchema.map((field) => ({
        name: field.name,
        validate: () => validateSchemaField(validationSchema, draft, field.name),
      })),
    )
    const validation = validateSchema(validationSchema, draft)
    if (!quickValid || !validation.valid) {
      setErrorMessage('Please fix validation errors before saving.')
      setValidationErrors(validation.errors)
      return
    }

    setErrorMessage('')
    setValidationErrors([])
    onSave({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      to: draft.to.trim(),
      imageUrl: draft.imageUrl.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/25">
      <aside
        className={`${isClosing ? 'slide-right-out' : 'slide-right-in'} h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl`}
        style={{ '--anim-distance': '520px', '--anim-duration': '420ms' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === 'create' ? 'Create Company Card' : 'Edit Company Card'}
          </h2>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <StatusMessage tone="error" message={errorMessage}>
            {validationErrors.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {validationErrors.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </StatusMessage>

          <div className="grid gap-4">
            <FormField label="ID">
              <input
                value={draft.id || '(Auto generated after create)'}
                readOnly
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500"
              />
            </FormField>

            <FormField label="Title" required error={getFieldError('title')}>
              <input
                value={draft.title}
                onChange={(event) => update('title', event.target.value)}
                onBlur={() => validateField('title', () => validateSchemaField(validationSchema, draft, 'title'))}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField label="Description" required error={getFieldError('description')}>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(event) => update('description', event.target.value)}
                onBlur={() =>
                  validateField('description', () => validateSchemaField(validationSchema, draft, 'description'))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField label="Path (to)" required error={getFieldError('to')}>
              <input
                value={draft.to}
                onChange={(event) => update('to', event.target.value)}
                onBlur={() => validateField('to', () => validateSchemaField(validationSchema, draft, 'to'))}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <FormField label="Image URL" required error={getFieldError('imageUrl')}>
              <input
                value={draft.imageUrl}
                onChange={(event) => update('imageUrl', event.target.value)}
                onBlur={() => {
                  syncPreviewAfterBlur()
                  validateField('imageUrl', () => validateSchemaField(validationSchema, draft, 'imageUrl'))
                }}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </FormField>

            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-700">Image Preview</p>
              {!previewUrl ? (
                <div className="flex h-28 w-28 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                  No image URL
                </div>
              ) : (
                <div className="relative h-28 w-28 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {previewState === 'error' ? (
                    <div className="flex h-full w-full items-center justify-center text-xs text-rose-600">
                      Image failed to load
                    </div>
                  ) : null}
                  <img
                    src={previewUrl}
                    alt="Company card preview"
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

            <FormField label="Status" required error={getFieldError('status')}>
              <DropdownSelect
                value={draft.status}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
                onChange={(nextValue) => update('status', nextValue)}
                onBlur={() => validateField('status', () => validateSchemaField(validationSchema, draft, 'status'))}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleRequestClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default CompanyCardEditorDrawer
