import { Bars3Icon } from '@heroicons/react/24/outline'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortableHeroItem = ({ slide, isSelected, onEdit, onAction, actionLabel, actionClassName }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-4 ${
        isSelected ? 'border-slate-200 bg-indigo-50/40' : 'border-slate-200 bg-white'
      } ${isDragging ? 'opacity-70 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            <p className="text-xs uppercase tracking-wide text-slate-500">{slide.id}</p>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{slide.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{slide.desc}</p>
        </div>
        <div className="w-40 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
          {slide.background?.imageUrl ? (
            <img src={slide.background.imageUrl} alt={slide.title} className="aspect-[16/9] w-full object-cover" />
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center text-xs text-slate-500">No image</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(slide.id)}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onAction(slide.id)}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${actionClassName}`}
        >
          {actionLabel}
        </button>
      </div>
    </li>
  )
}

const HomeHeroListSection = ({
  slides,
  selectedId,
  activeTab,
  onTabChange,
  onCreate,
  onEdit,
  onAction,
  onReorder,
}) => {
  const isActiveTab = activeTab === 'active'
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(active.id, over.id)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Home Hero Slides</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isActiveTab
              ? 'Drag to reorder. Click edit to update content.'
              : 'Archived slides are hidden from public API output.'}
          </p>
          <div className="mt-3 flex items-center gap-5">
            <button
              type="button"
              onClick={() => onTabChange('active')}
              className={`border-b-2 pb-1 text-sm font-medium ${
                isActiveTab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => onTabChange('archived')}
              className={`border-b-2 pb-1 text-sm font-medium ${
                !isActiveTab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Archived
            </button>
          </div>
        </div>
        {isActiveTab ? (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New Slide
          </button>
        ) : null}
      </div>

      {slides.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {isActiveTab ? 'No active hero slides.' : 'No archived hero slides.'}
        </div>
      ) : isActiveTab ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-5 space-y-3">
              {slides.map((slide) => (
                <SortableHeroItem
                  key={slide.id}
                  slide={slide}
                  isSelected={slide.id === selectedId}
                  onEdit={onEdit}
                  onAction={onAction}
                  actionLabel="Archive"
                  actionClassName="border border-red-200 text-red-600 hover:bg-red-50"
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="mt-5 space-y-3">
          {slides.map((slide) => (
            <li
              key={slide.id}
              className={`rounded-lg border p-4 ${
                slide.id === selectedId ? 'border-slate-200 bg-indigo-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{slide.id}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{slide.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{slide.desc}</p>
                </div>
                <div className="w-40 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                  {slide.background?.imageUrl ? (
                    <img
                      src={slide.background.imageUrl}
                      alt={slide.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center text-xs text-slate-500">
                      No image
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(slide.id)}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onAction(slide.id)}
                  className="rounded-md border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  Restore
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default HomeHeroListSection
