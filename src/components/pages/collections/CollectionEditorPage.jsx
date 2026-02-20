import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthProvider'
import {
  createBackstageCollection,
  fetchBackstageCollectionBySlug,
  fetchBackstageProductOptions,
  updateBackstageCollection,
} from '../../../api/backstageContentCollectionsApi'

const buildInitialForm = () => ({
  name: '',
  heroTitle: '',
  heroSubtitle: '',
  intro: '',
  imageUrl: '',
  status: 'active',
  linkedProductSlugs: [],
})

const CollectionEditorPage = ({ mode }) => {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user } = useAuth()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [optionsErrorMessage, setOptionsErrorMessage] = useState('')
  const [currentSlug, setCurrentSlug] = useState(slug ?? '')
  const [form, setForm] = useState(buildInitialForm)

  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState('')
  const [backgroundPreviewState, setBackgroundPreviewState] = useState('idle')
  const previewBlurTimerRef = useRef(null)
  const previewImgRef = useRef(null)

  const [productOptions, setProductOptions] = useState([])
  const [availableQuery, setAvailableQuery] = useState('')
  const [selectedQuery, setSelectedQuery] = useState('')
  const [availableChecked, setAvailableChecked] = useState([])
  const [selectedChecked, setSelectedChecked] = useState([])

  useEffect(() => {
    const loadProductOptions = async () => {
      setOptionsErrorMessage('')
      try {
        const payload = await fetchBackstageProductOptions('')
        const items = Array.isArray(payload?.data?.items) ? payload.data.items : []
        setProductOptions(items)
      } catch (error) {
        setProductOptions([])
        setOptionsErrorMessage(error?.message || 'Unable to load product options.')
      }
    }

    loadProductOptions()
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !slug) return

    const load = async () => {
      setStatus('loading')
      setErrorMessage('')

      try {
        const payload = await fetchBackstageCollectionBySlug(slug)
        const collection = payload?.data?.collection
        if (!collection) throw new Error('Collection not found')

        setCurrentSlug(collection.slug)
        setForm({
          name: collection.name ?? '',
          heroTitle: collection.heroTitle ?? '',
          heroSubtitle: collection.heroSubtitle ?? '',
          intro: collection.intro ?? '',
          imageUrl: collection.imageUrl ?? '',
          status: collection.status ?? 'active',
          linkedProductSlugs: Array.isArray(collection.linkedProductSlugs)
            ? collection.linkedProductSlugs
            : [],
        })

        const nextPreview = collection.imageUrl ?? ''
        setBackgroundPreviewUrl(nextPreview)
        if (!nextPreview) setBackgroundPreviewState('idle')

        setStatus('success')
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load collection')
      }
    }

    load()
  }, [mode, slug])

  useEffect(() => {
    return () => {
      if (previewBlurTimerRef.current) clearTimeout(previewBlurTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!backgroundPreviewUrl) {
      setBackgroundPreviewState('idle')
      return
    }

    setBackgroundPreviewState('loading')
    const immediateImg = previewImgRef.current
    if (immediateImg?.complete) {
      if (immediateImg.naturalWidth > 0) {
        setBackgroundPreviewState('loaded')
      } else {
        setBackgroundPreviewState('error')
      }
      return
    }

    let isCancelled = false
    const probe = new Image()
    const fallbackTimerId = window.setTimeout(() => {
      if (isCancelled) return
      const fallbackImg = previewImgRef.current
      if (fallbackImg?.complete && fallbackImg.naturalWidth > 0) {
        setBackgroundPreviewState('loaded')
      } else if (fallbackImg?.complete && fallbackImg.naturalWidth === 0) {
        setBackgroundPreviewState('error')
      }
    }, 1200)

    probe.onload = () => {
      if (isCancelled) return
      setBackgroundPreviewState('loaded')
    }

    probe.onerror = () => {
      if (isCancelled) return
      setBackgroundPreviewState('error')
    }

    probe.src = backgroundPreviewUrl

    return () => {
      isCancelled = true
      window.clearTimeout(fallbackTimerId)
      probe.onload = null
      probe.onerror = null
    }
  }, [backgroundPreviewUrl])

  const productMap = useMemo(
    () => new Map(productOptions.map((item) => [item.value, item])),
    [productOptions],
  )

  const availableOptions = useMemo(() => {
    const picked = new Set(form.linkedProductSlugs)
    const keyword = availableQuery.trim().toLowerCase()
    return productOptions.filter((item) => {
      if (picked.has(item.value)) return false
      if (!keyword) return true
      return item.label.toLowerCase().includes(keyword) || item.value.toLowerCase().includes(keyword)
    })
  }, [productOptions, form.linkedProductSlugs, availableQuery])

  const selectedOptions = useMemo(() => {
    const keyword = selectedQuery.trim().toLowerCase()
    return form.linkedProductSlugs
      .map((value) => productMap.get(value) ?? { value, label: value, imageUrl: '' })
      .filter((item) => {
        if (!keyword) return true
        return item.label.toLowerCase().includes(keyword) || item.value.toLowerCase().includes(keyword)
      })
  }, [form.linkedProductSlugs, productMap, selectedQuery])

  const toggleAvailableChecked = (value) => {
    setAvailableChecked((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    )
  }

  const toggleSelectedChecked = (value) => {
    setSelectedChecked((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    )
  }

  const moveToSelected = () => {
    if (availableChecked.length === 0) return
    setForm((prev) => {
      const next = new Set(prev.linkedProductSlugs)
      for (const slugValue of availableChecked) next.add(slugValue)
      return { ...prev, linkedProductSlugs: [...next] }
    })
    setAvailableChecked([])
  }

  const moveToAvailable = () => {
    if (selectedChecked.length === 0) return
    const removeSet = new Set(selectedChecked)
    setForm((prev) => ({
      ...prev,
      linkedProductSlugs: prev.linkedProductSlugs.filter((item) => !removeSet.has(item)),
    }))
    setSelectedChecked([])
  }

  useEffect(() => {
    const availableSet = new Set(availableOptions.map((item) => item.value))
    const selectedSet = new Set(selectedOptions.map((item) => item.value))
    setAvailableChecked((prev) => prev.filter((item) => availableSet.has(item)))
    setSelectedChecked((prev) => prev.filter((item) => selectedSet.has(item)))
  }, [availableOptions, selectedOptions])

  const syncBackgroundPreviewAfterBlur = () => {
    if (previewBlurTimerRef.current) clearTimeout(previewBlurTimerRef.current)

    previewBlurTimerRef.current = setTimeout(() => {
      const nextPreview = form.imageUrl?.trim() ?? ''
      if (!nextPreview) {
        setBackgroundPreviewUrl('')
        setBackgroundPreviewState('idle')
        return
      }

      if (nextPreview === backgroundPreviewUrl) return
      setBackgroundPreviewUrl(nextPreview)
    }, 500)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setStatus('saving')
    setErrorMessage('')

    try {
      const payload = {
        ...form,
        updatedBy: editorId,
      }

      if (mode === 'create') {
        await createBackstageCollection(payload)
      } else {
        await updateBackstageCollection(slug, payload)
      }

      navigate('/pages/content/collections', { replace: true })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save collection')
    }
  }

  const isBusy = status === 'loading' || status === 'saving'

  const renderProductAvatar = (item) => {
    if (item.imageUrl) {
      return (
        <img
          src={item.imageUrl}
          alt={item.label}
          className="h-8 w-8 rounded-full border border-slate-200 object-cover"
        />
      )
    }

    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-500">
        IMG
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {mode === 'create' ? 'Create Collection' : 'Edit Collection'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'create'
                ? 'Slug is generated by backend automatically based on collection name.'
                : 'Slug is read-only and cannot be changed.'}
            </p>
          </div>
          <Link
            to="/pages/content/collections"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back to List
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      ) : null}
      {optionsErrorMessage ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Linked Products options failed to load: {optionsErrorMessage}
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

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Hero Title</span>
              <input
                value={form.heroTitle}
                onChange={(event) => updateField('heroTitle', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Hero Subtitle</span>
              <input
                value={form.heroSubtitle}
                onChange={(event) => updateField('heroSubtitle', event.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="block space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Intro</span>
              <textarea
                rows={4}
                value={form.intro}
                onChange={(event) => updateField('intro', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>

            <label className="block space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Background Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(event) => updateField('imageUrl', event.target.value)}
                onBlur={syncBackgroundPreviewAfterBlur}
                className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
              />
            </label>

            <div className="space-y-1 text-sm md:col-span-2">
              <p className="font-medium text-slate-700">Background Preview</p>
              {!backgroundPreviewUrl ? (
                <div className="flex h-32 w-full max-w-[380px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                  No image URL
                </div>
              ) : (
                <div className="relative h-32 w-full max-w-[380px] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {backgroundPreviewState === 'error' ? (
                    <div className="flex h-full w-full items-center justify-center text-xs text-rose-600">
                      Image failed to load
                    </div>
                  ) : null}
                  <img
                    ref={previewImgRef}
                    src={backgroundPreviewUrl}
                    alt="Collection background preview"
                    className={`h-full w-full object-cover ${backgroundPreviewState === 'error' ? 'hidden' : ''}`}
                    onLoad={() => setBackgroundPreviewState('loaded')}
                    onError={() => setBackgroundPreviewState('error')}
                  />
                  {backgroundPreviewState === 'loading' ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-slate-600">
                      Loading preview...
                    </div>
                  ) : null}
                </div>
              )}
            </div>

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
          <h2 className="text-base font-semibold text-slate-900">Linked Products</h2>
          <p className="mt-1 text-sm text-slate-500">
            Available: products not linked to this collection. Selected: products linked to this collection.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available</p>
                <input
                  type="search"
                  value={availableQuery}
                  onChange={(event) => setAvailableQuery(event.target.value)}
                  placeholder="Search products"
                  className="mt-2 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <ul className="max-h-[340px] overflow-auto p-2">
                {availableOptions.length === 0 ? (
                  <li className="px-2 py-4 text-sm text-slate-500">No available products.</li>
                ) : (
                  availableOptions.map((item) => {
                    const checked = availableChecked.includes(item.value)
                    return (
                      <li key={item.value}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAvailableChecked(item.value)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {renderProductAvatar(item)}
                          <span className="min-w-0 flex-1 truncate" title={item.label}>
                            {item.label}
                          </span>
                        </label>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>

            <div className="flex flex-row items-center justify-center gap-2 lg:flex-col">
              <button
                type="button"
                onClick={moveToSelected}
                disabled={availableChecked.length === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                title="Move selected to linked"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={moveToAvailable}
                disabled={selectedChecked.length === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                title="Remove selected from linked"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected</p>
                <input
                  type="search"
                  value={selectedQuery}
                  onChange={(event) => setSelectedQuery(event.target.value)}
                  placeholder="Filter selected"
                  className="mt-2 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <ul className="max-h-[340px] overflow-auto p-2">
                {selectedOptions.length === 0 ? (
                  <li className="px-2 py-4 text-sm text-slate-500">No selected products.</li>
                ) : (
                  selectedOptions.map((item) => {
                    const checked = selectedChecked.includes(item.value)
                    return (
                      <li key={item.value}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectedChecked(item.value)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {renderProductAvatar(item)}
                          <span className="min-w-0 flex-1 truncate" title={item.label}>
                            {item.label}
                          </span>
                        </label>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2">
          <Link
            to="/pages/content/collections"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CollectionEditorPage
