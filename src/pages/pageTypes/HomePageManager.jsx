import { useEffect, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { fetchBackstageHomePage, updateBackstageHomePage } from '../../api/backstageHomeApi'
import StatusMessage from '../../components/common/StatusMessage'
import ConfirmDialog from '../../components/dialog/ConfirmDialog'
import HomeHeroEditorDrawer from '../../components/pages/home/HomeHeroEditorDrawer'
import HomeHeroListSection from '../../components/pages/home/HomeHeroListSection'
import { useAuth } from '../../features/auth/AuthProvider'

const createEmptySlide = () => ({
  id: `hero-${Date.now()}`,
  status: 'active',
  title: '',
  desc: '',
  primaryCta: {
    label: '',
    to: '',
  },
  background: {
    imageUrl: '',
    overlay: true,
    overlayOpacity: 0.3,
  },
  layers: [],
})

const HomePageManager = () => {
  const [slides, setSlides] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editorMode, setEditorMode] = useState('edit')
  const [editorSlide, setEditorSlide] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [heroTab, setHeroTab] = useState('active')
  const [actionTarget, setActionTarget] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      setErrorMessage('')
      try {
        const response = await fetchBackstageHomePage({ includeArchived: true })
        if (response.code !== 0) throw new Error(response.message || 'Failed to load Home page')

        const incomingSlides = Array.isArray(response.homePage?.heroSlides)
          ? response.homePage.heroSlides
          : []

        setSlides(incomingSlides)
        setSelectedId(incomingSlides.find((slide) => slide.status !== 'archived')?.id ?? null)
        setUpdatedAt(response.updatedAt)
        setStatus('success')
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load Home page data.')
      }
    }

    load()
  }, [])

  const openCreate = () => {
    setEditorMode('create')
    setEditorSlide(createEmptySlide())
    setIsDrawerOpen(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const openEdit = (slideId) => {
    const target = slides.find((slide) => slide.id === slideId)
    if (!target) return
    setSelectedId(slideId)
    setEditorMode('edit')
    setEditorSlide(structuredClone(target))
    setIsDrawerOpen(true)
    setErrorMessage('')
    setSuccessMessage('')
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setEditorSlide(null)
  }

  const applyEditor = (nextSlide) => {
    const normalizedSlide = { ...nextSlide, status: nextSlide.status ?? 'active' }
    if (editorMode === 'create') {
      setSlides((prev) => [...prev, normalizedSlide])
      setSelectedId(nextSlide.id)
    } else {
      setSlides((prev) =>
        prev.map((slide) => (slide.id === nextSlide.id ? normalizedSlide : slide))
      )
      setSelectedId(nextSlide.id)
    }
  }

  const requestArchiveOrRestoreSlide = (slideId) => {
    const target = slides.find((slide) => slide.id === slideId)
    if (!target) return
    setActionTarget({
      slide: target,
      action: target.status === 'archived' ? 'restore' : 'archive',
    })
  }

  const confirmArchiveOrRestoreSlide = () => {
    if (!actionTarget?.slide?.id) return
    const slideId = actionTarget.slide.id
    const nextStatus = actionTarget.action === 'restore' ? 'active' : 'archived'

    setSlides((prev) => {
      const next = prev.map((slide) =>
        slide.id === slideId ? { ...slide, status: nextStatus } : slide
      )
      setSelectedId((current) =>
        current === slideId ? next.find((slide) => slide.status !== 'archived')?.id ?? null : current
      )
      return next
    })

    if (actionTarget.action === 'restore') {
      setHeroTab('active')
      setSelectedId(slideId)
    }

    setSuccessMessage('')
    setErrorMessage('')
    setActionTarget(null)
  }

  const reorderSlides = (activeId, overId) => {
    setSlides((prev) => {
      const activeSlides = prev.filter((slide) => slide.status !== 'archived')
      const archivedSlides = prev.filter((slide) => slide.status === 'archived')
      const oldIndex = activeSlides.findIndex((slide) => slide.id === activeId)
      const newIndex = activeSlides.findIndex((slide) => slide.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return [...arrayMove(activeSlides, oldIndex, newIndex), ...archivedSlides]
    })
  }

  const saveAll = async () => {
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await updateBackstageHomePage({
        heroSlides: slides,
        updatedBy: user?.email ?? user?.name ?? 'unknown-editor',
      })
      if (response.code !== 0) throw new Error(response.message || 'Failed to save Home page')
      const nextSlides = Array.isArray(response.homePage?.heroSlides) ? response.homePage.heroSlides : slides
      setSlides(nextSlides)
      setUpdatedAt(response.updatedAt)
      setStatus('success')
      setSuccessMessage('Hero slides saved successfully.')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save Home page.')
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Home Page Manager</h1>
          {updatedAt ? (
            <p className="mt-1 text-xs text-slate-400">Last updated: {new Date(updatedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={saveAll}
          disabled={status === 'saving' || status === 'loading'}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <StatusMessage tone="error" message={errorMessage} />
      <StatusMessage tone="success" message={successMessage} />

      {status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading Home page data...</div>
      ) : (
        <HomeHeroListSection
          slides={slides.filter((slide) =>
            heroTab === 'archived' ? slide.status === 'archived' : slide.status !== 'archived'
          )}
          selectedId={selectedId}
          activeTab={heroTab}
          onTabChange={setHeroTab}
          onCreate={openCreate}
          onEdit={openEdit}
          onAction={requestArchiveOrRestoreSlide}
          onReorder={reorderSlides}
        />
      )}

      {isDrawerOpen ? (
        <HomeHeroEditorDrawer
          key={`${editorMode}-${editorSlide?.id ?? 'new'}`}
          isOpen={isDrawerOpen}
          mode={editorMode}
          initialSlide={editorSlide}
          onClose={closeDrawer}
          onApply={applyEditor}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(actionTarget)}
        title={actionTarget?.action === 'restore' ? 'Restore hero slide?' : 'Archive hero slide?'}
        description={
          actionTarget?.action === 'restore'
            ? `"${actionTarget?.slide?.title ?? ''}" will be restored and can appear on API output.`
            : `"${actionTarget?.slide?.title ?? ''}" will be archived and removed from API output.`
        }
        confirmLabel={actionTarget?.action === 'restore' ? 'Restore' : 'Archive'}
        cancelLabel="Cancel"
        onConfirm={confirmArchiveOrRestoreSlide}
        onCancel={() => setActionTarget(null)}
      />
    </section>
  )
}

export default HomePageManager
