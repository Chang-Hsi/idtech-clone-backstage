import { useState } from 'react'

const PRESET_OPTIONS = [
  { value: 'left', label: 'Layout A - Left Content' },
  { value: 'center', label: 'Layout B - Center Content' },
  { value: 'split', label: 'Layout C - Split + Foreground Image' },
]

const normalizeIdPrefix = (slideId = '') => {
  const normalized = slideId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'hero'
}

const buildLayersByPreset = ({ slideId, preset, title, desc, ctaLabel, ctaTo, foregroundImageUrl }) => {
  const prefix = normalizeIdPrefix(slideId)

  if (preset === 'center') {
    return [
      {
        id: `${prefix}-title`,
        type: 'title',
        content: title,
        position: { anchor: 'center', top: '35%', left: '50%', translateX: '-50%' },
        style: { maxWidth: '760px', titleSize: 'text-5xl', textAlign: 'center' },
        motion: { enter: 'slideLeft', duration: 700, delay: 160, easing: 'ease-out' },
      },
      {
        id: `${prefix}-desc`,
        type: 'desc',
        content: desc,
        position: { anchor: 'center', top: '54%', left: '50%', translateX: '-50%' },
        style: { maxWidth: '560px', descSize: 'text-lg', textAlign: 'center' },
        motion: { enter: 'slideLeft', duration: 700, delay: 300, easing: 'ease-out' },
      },
      {
        id: `${prefix}-cta`,
        type: 'cta',
        content: ctaLabel,
        to: ctaTo,
        position: { anchor: 'center', top: '68%', left: '50%', translateX: '-50%' },
        motion: { enter: 'slideUp', duration: 650, delay: 430, easing: 'ease-out' },
      },
    ]
  }

  if (preset === 'split') {
    return [
      {
        id: `${prefix}-title`,
        type: 'title',
        content: title,
        position: {
          anchor: 'center',
          top: '36%',
          left: '39%',
          translateX: '-50%',
          translateY: '-50%',
        },
        style: { maxWidth: '460px', titleSize: 'text-4xl', textAlign: 'left' },
        motion: { enter: 'slideLeft', duration: 780, delay: 140, easing: 'ease-out' },
      },
      {
        id: `${prefix}-desc`,
        type: 'desc',
        content: desc,
        position: {
          anchor: 'center',
          top: '36%',
          left: '61%',
          translateX: '-30%',
          translateY: '-50%',
        },
        style: { maxWidth: '400px', descSize: 'text-2xl', textAlign: 'left' },
        motion: { enter: 'slideRight', duration: 780, delay: 280, easing: 'ease-out' },
      },
      {
        id: `${prefix}-image`,
        type: 'fgImage',
        imageUrl: foregroundImageUrl,
        position: {
          anchor: 'center',
          top: '64%',
          left: '39%',
          translateX: '-50%',
          translateY: '-50%',
        },
        style: { width: '420px', height: '240px' },
        motion: { enter: 'slideDown', duration: 820, delay: 420, easing: 'ease-out' },
      },
      {
        id: `${prefix}-cta`,
        type: 'cta',
        content: ctaLabel,
        to: ctaTo,
        position: {
          anchor: 'center',
          top: '64%',
          left: '62%',
          translateX: '-50%',
          translateY: '-30%',
        },
        motion: { enter: 'slideUp', duration: 760, delay: 620, easing: 'ease-out' },
      },
    ]
  }

  return [
    {
      id: `${prefix}-title`,
      type: 'title',
      content: title,
      position: { anchor: 'left', top: '28%', left: '6rem' },
      style: { maxWidth: '780px', titleSize: 'text-6xl' },
      motion: { enter: 'slideDown', duration: 700, delay: 140, easing: 'ease-out' },
    },
    {
      id: `${prefix}-desc`,
      type: 'desc',
      content: desc,
      position: { anchor: 'left', top: '49%', left: '6rem' },
      style: { maxWidth: '620px', descSize: 'text-xl' },
      motion: { enter: 'slideDown', duration: 700, delay: 280, easing: 'ease-out' },
    },
    {
      id: `${prefix}-cta`,
      type: 'cta',
      content: ctaLabel,
      to: ctaTo,
      position: { anchor: 'left', top: '65%', left: '6rem' },
      motion: { enter: 'slideUp', duration: 650, delay: 420, easing: 'ease-out' },
    },
  ]
}

const inferPresetFromLayers = (layers = []) => {
  if (!Array.isArray(layers)) return 'left'
  if (layers.some((layer) => layer?.type === 'fgImage')) return 'split'

  const titleLayer = layers.find((layer) => layer?.type === 'title')
  if (titleLayer?.position?.anchor === 'center') return 'center'
  return 'left'
}

const findForegroundImage = (layers = []) =>
  layers.find((layer) => layer?.type === 'fgImage')?.imageUrl ?? ''

const HomeHeroEditorDrawer = ({ isOpen, initialSlide, mode, onClose, onApply }) => {
  const CLOSE_ANIMATION_MS = 220
  const [draft, setDraft] = useState(() => initialSlide)
  const [layoutPreset, setLayoutPreset] = useState(() => inferPresetFromLayers(initialSlide?.layers))
  const [foregroundImageUrl, setForegroundImageUrl] = useState(() => findForegroundImage(initialSlide?.layers))
  const [error, setError] = useState('')
  const [isClosing, setIsClosing] = useState(false)

  if (!isOpen || !draft) return null

  const update = (path, value) => {
    setDraft((prev) => {
      if (!prev) return prev
      if (path === 'id') return { ...prev, id: value }
      if (path === 'title') return { ...prev, title: value }
      if (path === 'desc') return { ...prev, desc: value }
      if (path === 'primaryCta.label') return { ...prev, primaryCta: { ...prev.primaryCta, label: value } }
      if (path === 'primaryCta.to') return { ...prev, primaryCta: { ...prev.primaryCta, to: value } }
      if (path === 'background.imageUrl')
        return { ...prev, background: { ...prev.background, imageUrl: value } }
      if (path === 'background.overlay')
        return { ...prev, background: { ...prev.background, overlay: value } }
      if (path === 'background.overlayOpacity')
        return { ...prev, background: { ...prev.background, overlayOpacity: value } }
      return prev
    })
  }

  const handleApply = () => {
    if (!draft.id.trim() || !draft.title.trim() || !draft.desc.trim()) {
      setError('Id, title, and description are required.')
      return
    }

    if (!draft.primaryCta.label.trim() || !draft.primaryCta.to.trim()) {
      setError('Primary CTA label and link are required.')
      return
    }

    if (!draft.background.imageUrl.trim()) {
      setError('Background image URL is required.')
      return
    }

    if (layoutPreset === 'split' && !foregroundImageUrl.trim()) {
      setError('Foreground image URL is required for split layout.')
      return
    }

    const normalizedOpacity = Number(draft.background.overlayOpacity)
    if (Number.isNaN(normalizedOpacity) || normalizedOpacity < 0 || normalizedOpacity > 1) {
      setError('Overlay opacity must be between 0 and 1.')
      return
    }

    const generatedLayers = buildLayersByPreset({
      slideId: draft.id,
      preset: layoutPreset,
      title: draft.title,
      desc: draft.desc,
      ctaLabel: draft.primaryCta.label,
      ctaTo: draft.primaryCta.to,
      foregroundImageUrl: foregroundImageUrl.trim(),
    })

    onApply({
      ...draft,
      background: {
        ...draft.background,
        overlayOpacity: normalizedOpacity,
      },
      layers: generatedLayers,
    })
    setIsClosing(true)
    window.setTimeout(() => onClose(), CLOSE_ANIMATION_MS)
  }

  const handleRequestClose = () => {
    setIsClosing(true)
    window.setTimeout(() => onClose(), CLOSE_ANIMATION_MS)
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/25">
      <aside
        className={`${isClosing ? 'slide-right-out' : 'slide-right-in'} h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl`}
        style={{ '--anim-distance': '848px', '--anim-duration': '520ms' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === 'create' ? 'Create Hero Slide' : 'Edit Hero Slide'}
          </h2>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-700">
          Layout structure is locked by preset. You can edit text, links, and images only.
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Layout Preset</p>
            <div className="space-y-2">
              {PRESET_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="layout-preset"
                    value={option.value}
                    checked={layoutPreset === option.value}
                    onChange={(event) => setLayoutPreset(event.target.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Slide ID</span>
            <input
              value={draft.id}
              onChange={(event) => update('id', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              value={draft.title}
              onChange={(event) => update('title', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              rows={3}
              value={draft.desc}
              onChange={(event) => update('desc', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Primary CTA Label</span>
              <input
                value={draft.primaryCta.label}
                onChange={(event) => update('primaryCta.label', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Primary CTA Link</span>
              <input
                value={draft.primaryCta.to}
                onChange={(event) => update('primaryCta.to', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Background Image URL</span>
            <input
              value={draft.background.imageUrl}
              onChange={(event) => update('background.imageUrl', event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </label>

          {layoutPreset === 'split' ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Foreground Image URL</span>
              <input
                value={foregroundImageUrl}
                onChange={(event) => setForegroundImageUrl(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(draft.background.overlay)}
                onChange={(event) => update('background.overlay', event.target.checked)}
              />
              Overlay enabled
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Overlay Opacity (0 - 1)</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={draft.background.overlayOpacity}
                onChange={(event) => update('background.overlayOpacity', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  )
}

export default HomeHeroEditorDrawer
