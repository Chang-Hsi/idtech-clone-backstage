import { Bars3Icon, PencilSquareIcon } from '@heroicons/react/24/outline'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../features/auth/AuthContext'
import StatusMessage from '../../common/StatusMessage'
import {
  archiveBackstageCompanyCard,
  fetchBackstageCompanyCards,
  reorderBackstageCompanyCards,
  restoreBackstageCompanyCard,
  updateBackstageCompanyCard,
} from '../../../api/backstageCompanyCardsApi'
import CompanyCardEditorDrawer from './CompanyCardEditorDrawer'

const TAB_ACTIVE = 'active'
const TAB_ARCHIVED = 'archived'

const CompanySortableCard = ({ card, onEdit, isDraggingDisabled = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: isDraggingDisabled,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition ${
        isDragging ? 'cursor-grabbing shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" className="group text-left" onClick={() => onEdit(card)}>
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-slate-500">IMG</span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(card)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Edit card"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={`rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${
              isDraggingDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab'
            }`}
            title="Drag to reorder"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button type="button" className="mt-3 block w-full text-left" onClick={() => onEdit(card)}>
        <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{card.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{card.description}</p>
        <p className="mt-2 line-clamp-1 text-xs text-indigo-700">{card.to}</p>
      </button>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            card.status === 'archived'
              ? 'bg-slate-200 text-slate-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {card.status === 'archived' ? 'Archived' : 'Active'}
        </span>
      </div>
    </article>
  )
}

const CompanyCardsContentGrid = () => {
  const { user } = useAuth()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const [activeTab, setActiveTab] = useState(TAB_ACTIVE)
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [items, setItems] = useState([])
  const [drawerState, setDrawerState] = useState({ isOpen: false, mode: 'edit', card: null })

  const loadCards = async (nextStatus = activeTab, nextQuery = query) => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const payload = await fetchBackstageCompanyCards({
        status: nextStatus,
        q: nextQuery,
      })
      setItems(Array.isArray(payload?.data?.items) ? payload.data.items : [])
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to load company cards.')
    }
  }

  useEffect(() => {
    loadCards(activeTab, query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, query])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setQuery(queryInput.trim())
  }

  const openEditDrawer = (card) => {
    setDrawerState({ isOpen: true, mode: 'edit', card })
  }

  const closeDrawer = () => {
    setDrawerState({ isOpen: false, mode: 'edit', card: null })
  }

  const handleSaveCard = async (draft) => {
    setStatus('saving')
    setErrorMessage('')
    try {
      if (drawerState.card?.id) {
        await updateBackstageCompanyCard(drawerState.card.id, { ...draft, updatedBy: editorId })
      }

      if (drawerState.card?.id) {
        if (draft.status === 'archived' && drawerState.card.status !== 'archived') {
          await archiveBackstageCompanyCard(drawerState.card.id, editorId)
        }
        if (draft.status === 'active' && drawerState.card.status === 'archived') {
          await restoreBackstageCompanyCard(drawerState.card.id, editorId)
        }
      }

      closeDrawer()
      await loadCards(activeTab, query)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save company card.')
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)

    try {
      await reorderBackstageCompanyCards({
        status: activeTab,
        orderedIds: reordered.map((item) => item.id),
        updatedBy: editorId,
      })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to persist card order.')
      loadCards(activeTab, query)
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Company Cards</h1>
        </div>

        <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab(TAB_ACTIVE)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              activeTab === TAB_ACTIVE
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TAB_ARCHIVED)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              activeTab === TAB_ARCHIVED
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Archived
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title, description, or path"
            className="h-10 w-full max-w-sm rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            Search
          </button>
        </form>
      </div>

      <StatusMessage tone="error" message={errorMessage} />

      {status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading company cards...
        </div>
      ) : null}

      {status !== 'loading' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
            {items.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                No company cards found.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <CompanySortableCard
                    key={item.id}
                    card={item}
                    onEdit={openEditDrawer}
                    isDraggingDisabled={status === 'saving'}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      ) : null}

      {drawerState.isOpen ? (
        <CompanyCardEditorDrawer
          key={`${drawerState.mode}-${drawerState.card?.id ?? 'new'}`}
          isOpen={drawerState.isOpen}
          mode={drawerState.mode}
          card={drawerState.card}
          onClose={closeDrawer}
          onSave={handleSaveCard}
          isSaving={status === 'saving'}
        />
      ) : null}
    </section>
  )
}

export default CompanyCardsContentGrid
