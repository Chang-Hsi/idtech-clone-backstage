import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthProvider'
import {
  createBackstageProduct,
  fetchBackstageProductBySlug,
  updateBackstageProduct,
} from '../../../api/backstageContentProductsApi'

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
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [currentSlug, setCurrentSlug] = useState(slug ?? '')
  const [form, setForm] = useState(buildInitialForm)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState('')
  const [heroPreviewState, setHeroPreviewState] = useState('idle')
  const previewBlurTimerRef = useRef(null)
  const previewImgRef = useRef(null)

  useEffect(() => {
    if (mode !== 'edit' || !slug) return

    const load = async () => {
      setStatus('loading')
      setErrorMessage('')

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
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load product')
      }
    }

    load()
  }, [mode, slug])

  useEffect(() => {
    return () => {
      if (previewBlurTimerRef.current) {
        clearTimeout(previewBlurTimerRef.current)
      }
    }
  }, [])

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
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = {
        ...form,
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
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'create'
                ? 'Slug is generated by backend automatically based on product name.'
                : 'Slug is read-only and cannot be changed.'}
            </p>
          </div>
          <Link
            to="/pages/content/products"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back to List
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      ) : null}
      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Basic</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Name *</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Slug</span>
              <input
                value={mode === 'edit' ? currentSlug : '(Auto generated after create)'}
                readOnly
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500"
              />
            </label>

            <label className="block space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Short Description</span>
              <textarea
                rows={3}
                value={form.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="block space-y-1 text-sm md:max-w-[220px]">
              <span className="font-medium text-slate-700">Status</span>
              <select
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Media</h2>
          <div className="mt-4 grid gap-4">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Hero Image URL</span>
              <input
                value={form.media.heroImageUrl}
                onChange={(event) => updateNestedField('media', 'heroImageUrl', event.target.value)}
                onBlur={syncHeroPreviewAfterBlur}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-700">Background Preview</p>
              {!heroPreviewUrl ? (
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
                    src={heroPreviewUrl}
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
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Hero Eyebrow</span>
              <input
                value={form.detail.heroEyebrow}
                onChange={(event) => updateNestedField('detail', 'heroEyebrow', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Hero Description</span>
              <textarea
                rows={3}
                value={form.detail.heroDescription}
                onChange={(event) => updateNestedField('detail', 'heroDescription', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Detail Hero Image URL</span>
              <input
                value={form.detail.heroImageUrl}
                onChange={(event) => updateNestedField('detail', 'heroImageUrl', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Downloads</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Datasheet Name</span>
              <input
                value={form.downloads.datasheetName}
                onChange={(event) => updateNestedField('downloads', 'datasheetName', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Datasheet URL</span>
              <input
                value={form.downloads.datasheetUrl}
                onChange={(event) => updateNestedField('downloads', 'datasheetUrl', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block space-y-1 text-sm md:max-w-[220px]">
              <span className="font-medium text-slate-700">Datasheet Mime Type</span>
              <input
                value={form.downloads.datasheetMimeType}
                onChange={(event) => updateNestedField('downloads', 'datasheetMimeType', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>
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
