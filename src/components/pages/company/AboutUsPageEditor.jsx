import { Bars3Icon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../features/auth/AuthContext'
import DropdownSelect from '../../common/DropdownSelect'
import FormField from '../../common/FormField'
import StatusMessage from '../../common/StatusMessage'
import useFormValidation from '../../../hooks/useFormValidation'
import { fetchBackstageCompanyAboutUs, updateBackstageCompanyAboutUs } from '../../../api/backstageCompanyAboutUsApi'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import { customRule, emailRule, enumRule, phoneLooseRule, requiredRule } from '../../../utils/validation/rules'
import { buildAboutUsPageValidationSchema } from './AboutUsPageEditor.schema'

const TAB_ACTIVE = 'active'
const TAB_ARCHIVED = 'archived'
const TIMELINE_START_DECADE = 1990
const isHrefAllowed = (href) => /^(tel:|mailto:|https?:\/\/|\/|#)/i.test(String(href ?? '').trim())

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const parseYearSortKey = (yearLabel) => {
  const text = String(yearLabel ?? '').trim()
  const decadeMatch = text.match(/^(\d{4})s$/i)
  if (decadeMatch) return Number(decadeMatch[1])
  const yearMatch = text.match(/^(\d{4})$/)
  if (yearMatch) return Number(yearMatch[1])
  return Number.POSITIVE_INFINITY
}

const bySortOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)

const withSortOrder = (items) => items.map((item, index) => ({ ...item, sortOrder: index }))

const buildTimelineYearOptions = () => {
  const currentDecade = Math.floor(new Date().getFullYear() / 10) * 10
  const options = []

  for (let decade = TIMELINE_START_DECADE; decade <= currentDecade; decade += 10) {
    const value = `${decade}s`
    options.push({ value, label: value })
  }

  return options
}

const normalizePayload = (raw) => {
  const page = raw ?? {}
  return {
    intro: {
      title: page?.intro?.title ?? '',
      paragraphs: Array.isArray(page?.intro?.paragraphs) ? page.intro.paragraphs : [''],
      imageUrl: page?.intro?.imageUrl ?? '',
    },
    highlights: Array.isArray(page?.highlights)
      ? page.highlights.map((item, index) => ({
          id: item.id ?? createId('highlight'),
          eyebrow: item.eyebrow ?? '',
          title: item.title ?? '',
          imageUrl: item.imageUrl ?? '',
          status: item.status === 'archived' ? 'archived' : 'active',
          sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
        }))
      : [],
    innovationTimeline: {
      title: page?.innovationTimeline?.title ?? '',
      items: Array.isArray(page?.innovationTimeline?.items)
        ? page.innovationTimeline.items.map((item, index) => ({
            id: item.id ?? createId('timeline'),
            year: item.year ?? '',
            title: item.title ?? '',
            description: item.description ?? '',
            status: item.status === 'archived' ? 'archived' : 'active',
            sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
          }))
        : [],
    },
    connectInfo: {
      title: page?.connectInfo?.title ?? '',
      description: page?.connectInfo?.description ?? '',
      offices: Array.isArray(page?.connectInfo?.offices)
        ? page.connectInfo.offices.map((item, index) => ({
            id: item.id ?? createId('office'),
            name: item.name ?? '',
            phone: item.phone ?? '',
            phoneHref: item.phoneHref ?? '',
            email: item.email ?? '',
            emailHref: item.emailHref ?? '',
            address: item.address ?? '',
            status: item.status === 'archived' ? 'archived' : 'active',
            sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
          }))
        : [],
    },
  }
}

const SortableRow = ({ item, children, disabled = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={`rounded-lg border border-slate-200 bg-white p-3 ${isDragging ? 'shadow-lg' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{item.id}</span>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab'}`}
          title="Drag to reorder"
        >
          <Bars3Icon className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}

const ImageUrlPreview = ({ url, alt }) => {
  const previewUrl = String(url ?? '').trim()
  const [loadedUrl, setLoadedUrl] = useState('')
  const [errorUrl, setErrorUrl] = useState('')
  const previewState = !previewUrl ? 'idle' : errorUrl === previewUrl ? 'error' : loadedUrl === previewUrl ? 'loaded' : 'loading'

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-700">Background Preview</p>
      {!previewUrl ? (
        <div className="flex h-36 w-36 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
          No image URL
        </div>
      ) : (
        <div className="relative h-36 w-36 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          {previewState === 'error' ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-rose-600">
              Image failed to load
            </div>
          ) : null}
          <img
            src={previewUrl}
            alt={alt}
            className={`h-full w-full object-cover ${previewState === 'error' ? 'hidden' : ''}`}
            onLoad={() => {
              setLoadedUrl(previewUrl)
              setErrorUrl((prev) => (prev === previewUrl ? '' : prev))
            }}
            onError={() => setErrorUrl(previewUrl)}
          />
          {previewState === 'loading' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-slate-600">
              Loading preview...
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

const SortableTimelineItem = ({ item, index, total, onEdit, onRemove, disabled = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative pl-9 ${isDragging ? 'z-20 bg-white' : ''}`}>
      {index < total - 1 ? <span className="absolute bottom-0 left-3 top-5 w-px bg-slate-200" /> : null}
      <span className="absolute left-[7px] top-3 h-3 w-3 rounded-full border-2 border-indigo-200 bg-indigo-500" />

      <div className="grid grid-cols-12 items-center gap-3 py-3">
        <p className="col-span-12 text-xs font-semibold uppercase tracking-wide text-indigo-600 md:col-span-2">
          {item.year || 'No year'}
        </p>
        <p className="col-span-12 truncate text-sm font-semibold text-slate-900 md:col-span-3">
          {item.title || 'Untitled timeline item'}
        </p>
        <p className="col-span-12 truncate text-sm text-slate-600 md:col-span-5">
          {item.description || 'No description'}
        </p>
        <div className="col-span-12 flex items-center justify-end gap-1 md:col-span-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={`rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab'}`}
            title="Drag to reorder"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
            title="Edit timeline item"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
            title="Delete timeline item"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const SortableOfficeItem = ({ item, onEdit, onRemove, disabled = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={`grid grid-cols-12 items-center gap-3 py-3 ${isDragging ? 'bg-white' : ''}`}>
      <p className="col-span-12 truncate text-sm font-semibold text-slate-900 md:col-span-2">
        {item.name || 'Untitled office'}
      </p>
      <p className="col-span-12 truncate text-sm text-slate-700 md:col-span-2">{item.phone || '-'}</p>
      <p className="col-span-12 truncate text-sm text-slate-700 md:col-span-3">{item.email || '-'}</p>
      <p className="col-span-12 truncate text-sm text-slate-700 md:col-span-3">{item.address || '-'}</p>
      <p className="col-span-12 text-xs font-medium uppercase tracking-wide text-slate-500 md:col-span-1">
        {item.status}
      </p>
      <div className="col-span-12 flex items-center justify-end gap-1 md:col-span-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab'}`}
          title="Drag to reorder"
        >
          <Bars3Icon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
          title="Edit office"
        >
          <PencilSquareIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
          title="Delete office"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const AboutUsPageEditor = () => {
  const { user } = useAuth()
  const { clearAll, getFieldError, validateField, validateMany } = useFormValidation()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [form, setForm] = useState(() => normalizePayload(null))
  const [highlightsTab, setHighlightsTab] = useState(TAB_ACTIVE)
  const [timelineTab, setTimelineTab] = useState(TAB_ACTIVE)
  const [officesTab, setOfficesTab] = useState(TAB_ACTIVE)
  const [timelineDialog, setTimelineDialog] = useState({
    isOpen: false,
    mode: 'create',
    targetId: '',
    year: '',
    title: '',
    description: '',
    status: TAB_ACTIVE,
  })
  const [timelineDialogErrors, setTimelineDialogErrors] = useState({})
  const [officeDialog, setOfficeDialog] = useState({
    isOpen: false,
    mode: 'create',
    targetId: '',
    name: '',
    phone: '',
    phoneHref: '',
    email: '',
    emailHref: '',
    address: '',
    status: TAB_ACTIVE,
  })
  const [officeDialogErrors, setOfficeDialogErrors] = useState({})
  const validationSchema = useMemo(() => buildAboutUsPageValidationSchema(form), [form])
  const timelineYearOptions = useMemo(() => buildTimelineYearOptions(), [])

  const validateByFieldName = (fieldName) =>
    validateField(fieldName, () => validateSchemaField(validationSchema, form, fieldName))

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await fetchBackstageCompanyAboutUs()
        const page = payload?.data?.aboutUsPage
        setForm(normalizePayload(page))
        setUpdatedAt(page?.updatedAt ?? '')
        setStatus('success')
        setValidationErrors([])
        clearAll()
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load About Us content.')
      }
    }

    load()
  }, [clearAll])

  const updateIntroField = (field, value) => {
    setForm((prev) => ({ ...prev, intro: { ...prev.intro, [field]: value } }))
  }

  const updateIntroParagraph = (index, value) => {
    setForm((prev) => {
      const nextParagraphs = [...prev.intro.paragraphs]
      nextParagraphs[index] = value
      return { ...prev, intro: { ...prev.intro, paragraphs: nextParagraphs } }
    })
  }

  const addIntroParagraph = () => {
    setForm((prev) => ({ ...prev, intro: { ...prev.intro, paragraphs: [...prev.intro.paragraphs, ''] } }))
  }

  const removeIntroParagraph = (index) => {
    setForm((prev) => {
      const nextParagraphs = prev.intro.paragraphs.filter((_, itemIndex) => itemIndex !== index)
      return { ...prev, intro: { ...prev.intro, paragraphs: nextParagraphs.length ? nextParagraphs : [''] } }
    })
  }

  const updateListItem = (listKey, id, field, value) => {
    setForm((prev) => {
      if (listKey === 'innovationTimeline') {
        return {
          ...prev,
          innovationTimeline: {
            ...prev.innovationTimeline,
            items: prev.innovationTimeline.items.map((item) =>
              item.id === id ? { ...item, [field]: value } : item,
            ),
          },
        }
      }

      return {
        ...prev,
        [listKey]: prev[listKey].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      }
    })
  }

  const addHighlight = () => {
    setForm((prev) => ({
      ...prev,
      highlights: withSortOrder([
        ...prev.highlights,
        {
          id: createId('highlight'),
          eyebrow: '',
          title: '',
          imageUrl: '',
          status: highlightsTab,
          sortOrder: prev.highlights.length,
        },
      ]),
    }))
  }

  const openCreateTimelineDialog = () => {
    setTimelineDialogErrors({})
    setTimelineDialog({
      isOpen: true,
      mode: 'create',
      targetId: '',
      year: '',
      title: '',
      description: '',
      status: timelineTab,
    })
  }

  const openEditTimelineDialog = (item) => {
    setTimelineDialogErrors({})
    setTimelineDialog({
      isOpen: true,
      mode: 'edit',
      targetId: item.id,
      year: item.year ?? '',
      title: item.title ?? '',
      description: item.description ?? '',
      status: item.status === TAB_ARCHIVED ? TAB_ARCHIVED : TAB_ACTIVE,
    })
  }

  const closeTimelineDialog = () => {
    setTimelineDialogErrors({})
    setTimelineDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const validateTimelineDialog = () => {
    const values = {
      year: timelineDialog.year,
      title: timelineDialog.title,
      description: timelineDialog.description,
      status: timelineDialog.status,
    }
    const dialogSchema = [
      { name: 'year', rules: [requiredRule('Year / Decade is required.')] },
      { name: 'title', rules: [requiredRule('Timeline title is required.')] },
      { name: 'description', rules: [requiredRule('Timeline description is required.')] },
      { name: 'status', rules: [enumRule([TAB_ACTIVE, TAB_ARCHIVED], 'Timeline status is invalid.')] },
    ]
    const validation = validateSchema(dialogSchema, values)
    setTimelineDialogErrors(validation.errorMap)
    return validation.valid
  }

  const saveTimelineDialog = () => {
    if (!validateTimelineDialog()) return

    if (timelineDialog.mode === 'create') {
      setForm((prev) => ({
        ...prev,
        innovationTimeline: {
          ...prev.innovationTimeline,
          items: withSortOrder([
            ...prev.innovationTimeline.items,
            {
              id: createId('timeline'),
              year: timelineDialog.year.trim(),
              title: timelineDialog.title.trim(),
              description: timelineDialog.description.trim(),
              status: timelineDialog.status,
              sortOrder: prev.innovationTimeline.items.length,
            },
          ]),
        },
      }))
      setTimelineTab(timelineDialog.status)
      closeTimelineDialog()
      return
    }

    setForm((prev) => ({
      ...prev,
      innovationTimeline: {
        ...prev.innovationTimeline,
        items: withSortOrder(
          prev.innovationTimeline.items.map((item) =>
            item.id === timelineDialog.targetId
              ? {
                  ...item,
                  year: timelineDialog.year.trim(),
                  title: timelineDialog.title.trim(),
                  description: timelineDialog.description.trim(),
                  status: timelineDialog.status,
                }
              : item,
          ),
        ),
      },
    }))
    setTimelineTab(timelineDialog.status)
    closeTimelineDialog()
  }

  const openCreateOfficeDialog = () => {
    setOfficeDialogErrors({})
    setOfficeDialog({
      isOpen: true,
      mode: 'create',
      targetId: '',
      name: '',
      phone: '',
      phoneHref: '',
      email: '',
      emailHref: '',
      address: '',
      status: officesTab,
    })
  }

  const openEditOfficeDialog = (item) => {
    setOfficeDialogErrors({})
    setOfficeDialog({
      isOpen: true,
      mode: 'edit',
      targetId: item.id,
      name: item.name ?? '',
      phone: item.phone ?? '',
      phoneHref: item.phoneHref ?? '',
      email: item.email ?? '',
      emailHref: item.emailHref ?? '',
      address: item.address ?? '',
      status: item.status === TAB_ARCHIVED ? TAB_ARCHIVED : TAB_ACTIVE,
    })
  }

  const closeOfficeDialog = () => {
    setOfficeDialogErrors({})
    setOfficeDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const validateOfficeDialog = () => {
    const values = {
      name: officeDialog.name,
      phone: officeDialog.phone,
      phoneHref: officeDialog.phoneHref,
      email: officeDialog.email,
      emailHref: officeDialog.emailHref,
      address: officeDialog.address,
      status: officeDialog.status,
    }
    const dialogSchema = [
      { name: 'name', rules: [requiredRule('Office name is required.')] },
      {
        name: 'phone',
        rules: [requiredRule('Phone is required.'), phoneLooseRule('Phone format is invalid.')],
      },
      {
        name: 'phoneHref',
        rules: [
          customRule(
            (value) => (!String(value ?? '').trim() || isHrefAllowed(value) ? '' : 'Phone href format is invalid.'),
            'phoneHref',
          ),
        ],
      },
      {
        name: 'email',
        rules: [requiredRule('Email is required.'), emailRule('Email format is invalid.')],
      },
      {
        name: 'emailHref',
        rules: [
          customRule(
            (value) =>
              !String(value ?? '').trim() || String(value).trim().startsWith('mailto:')
                ? ''
                : 'Email href should start with mailto:.',
            'emailHref',
          ),
        ],
      },
      { name: 'address', rules: [requiredRule('Address is required.')] },
      { name: 'status', rules: [enumRule([TAB_ACTIVE, TAB_ARCHIVED], 'Office status is invalid.')] },
    ]

    const validation = validateSchema(dialogSchema, values)
    setOfficeDialogErrors(validation.errorMap)
    return validation.valid
  }

  const saveOfficeDialog = () => {
    if (!validateOfficeDialog()) return

    if (officeDialog.mode === 'create') {
      setForm((prev) => ({
        ...prev,
        connectInfo: {
          ...prev.connectInfo,
          offices: withSortOrder([
            ...prev.connectInfo.offices,
            {
              id: createId('office'),
              name: officeDialog.name.trim(),
              phone: officeDialog.phone.trim(),
              phoneHref: officeDialog.phoneHref.trim(),
              email: officeDialog.email.trim(),
              emailHref: officeDialog.emailHref.trim(),
              address: officeDialog.address.trim(),
              status: officeDialog.status,
              sortOrder: prev.connectInfo.offices.length,
            },
          ]),
        },
      }))
      setOfficesTab(officeDialog.status)
      closeOfficeDialog()
      return
    }

    setForm((prev) => ({
      ...prev,
      connectInfo: {
        ...prev.connectInfo,
        offices: withSortOrder(
          prev.connectInfo.offices.map((item) =>
            item.id === officeDialog.targetId
              ? {
                  ...item,
                  name: officeDialog.name.trim(),
                  phone: officeDialog.phone.trim(),
                  phoneHref: officeDialog.phoneHref.trim(),
                  email: officeDialog.email.trim(),
                  emailHref: officeDialog.emailHref.trim(),
                  address: officeDialog.address.trim(),
                  status: officeDialog.status,
                }
              : item,
          ),
        ),
      },
    }))
    setOfficesTab(officeDialog.status)
    closeOfficeDialog()
  }

  const removeHighlight = (id) => {
    setForm((prev) => ({ ...prev, highlights: withSortOrder(prev.highlights.filter((item) => item.id !== id)) }))
  }
  const removeTimelineItem = (id) => {
    setForm((prev) => ({
      ...prev,
      innovationTimeline: {
        ...prev.innovationTimeline,
        items: withSortOrder(prev.innovationTimeline.items.filter((item) => item.id !== id)),
      },
    }))
  }
  const removeOffice = (id) => {
    setForm((prev) => ({
      ...prev,
      connectInfo: {
        ...prev.connectInfo,
        offices: withSortOrder(prev.connectInfo.offices.filter((item) => item.id !== id)),
      },
    }))
  }

  const handleListDragEnd = (listKey, statusFilter, event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (listKey === 'highlights') {
      setForm((prev) => {
        const scoped = prev.highlights.filter((item) => item.status === statusFilter).sort(bySortOrder)
        const other = prev.highlights.filter((item) => item.status !== statusFilter)
        const oldIndex = scoped.findIndex((item) => item.id === active.id)
        const newIndex = scoped.findIndex((item) => item.id === over.id)
        if (oldIndex < 0 || newIndex < 0) return prev
        const reordered = arrayMove(scoped, oldIndex, newIndex)
        return { ...prev, highlights: withSortOrder([...reordered, ...other]) }
      })
      return
    }

    if (listKey === 'timeline') {
      setForm((prev) => {
        const scoped = prev.innovationTimeline.items
          .filter((item) => item.status === statusFilter)
          .sort(bySortOrder)
        const other = prev.innovationTimeline.items.filter((item) => item.status !== statusFilter)
        const oldIndex = scoped.findIndex((item) => item.id === active.id)
        const newIndex = scoped.findIndex((item) => item.id === over.id)
        if (oldIndex < 0 || newIndex < 0) return prev

        const reordered = arrayMove(scoped, oldIndex, newIndex)
        const hasOrderViolation = reordered.some((item, index) => {
          if (index === 0) return false
          return parseYearSortKey(item.year) < parseYearSortKey(reordered[index - 1].year)
        })
        if (hasOrderViolation) {
          setErrorMessage('Timeline drag is limited by year order. Please keep years in chronological order.')
          return prev
        }

        return {
          ...prev,
          innovationTimeline: {
            ...prev.innovationTimeline,
            items: withSortOrder([...reordered, ...other]),
          },
        }
      })
      return
    }

    if (listKey === 'offices') {
      setForm((prev) => {
        const scoped = prev.connectInfo.offices.filter((item) => item.status === statusFilter).sort(bySortOrder)
        const other = prev.connectInfo.offices.filter((item) => item.status !== statusFilter)
        const oldIndex = scoped.findIndex((item) => item.id === active.id)
        const newIndex = scoped.findIndex((item) => item.id === over.id)
        if (oldIndex < 0 || newIndex < 0) return prev
        const reordered = arrayMove(scoped, oldIndex, newIndex)
        return {
          ...prev,
          connectInfo: {
            ...prev.connectInfo,
            offices: withSortOrder([...reordered, ...other]),
          },
        }
      })
    }
  }

  const save = async () => {
    const quickValid = validateMany(
      validationSchema.map((field) => ({
        name: field.name,
        validate: () => validateSchemaField(validationSchema, form, field.name),
      })),
    )
    const validation = validateSchema(validationSchema, form)
    if (!quickValid || !validation.valid) {
      setStatus('error')
      setErrorMessage('Please fix the validation errors before saving.')
      setValidationErrors(validation.errors)
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setValidationErrors([])
    setSuccessMessage('')

    try {
      const payload = {
        intro: {
          title: form.intro.title,
          paragraphs: form.intro.paragraphs.filter((item) => item.trim().length > 0),
          imageUrl: form.intro.imageUrl,
        },
        highlights: form.highlights,
        innovationTimeline: {
          title: form.innovationTimeline.title,
          items: form.innovationTimeline.items,
        },
        connectInfo: {
          title: form.connectInfo.title,
          description: form.connectInfo.description,
          offices: form.connectInfo.offices,
        },
        updatedBy: editorId,
      }
      await updateBackstageCompanyAboutUs(payload)
      setSuccessMessage('About Us content saved.')
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save About Us content.')
    }
  }

  const visibleHighlights = form.highlights.filter((item) => item.status === highlightsTab).sort(bySortOrder)
  const visibleTimeline = form.innovationTimeline.items.filter((item) => item.status === timelineTab).sort(bySortOrder)
  const visibleOffices = form.connectInfo.offices.filter((item) => item.status === officesTab).sort(bySortOrder)

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">About Us</h1>
            {updatedAt ? <p className="mt-1 text-xs text-slate-500">Last updated: {updatedAt}</p> : null}
          </div>
          <button
            type="button"
            onClick={save}
            disabled={status === 'saving'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {status === 'saving' ? 'Saving...' : 'Save'}
          </button>
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Intro</h2>
        <div className="mt-4 grid gap-4">
          <FormField label="Title" required error={getFieldError('intro.title')}>
            <input
              value={form.intro.title}
              onChange={(event) => updateIntroField('title', event.target.value)}
              onBlur={() => validateByFieldName('intro.title')}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>

          <FormField label="Image URL" required error={getFieldError('intro.imageUrl')}>
            <input
              value={form.intro.imageUrl}
              onChange={(event) => updateIntroField('imageUrl', event.target.value)}
              onBlur={() => validateByFieldName('intro.imageUrl')}
              className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
            />
          </FormField>

          <ImageUrlPreview url={form.intro.imageUrl} alt="About Us intro preview" />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Paragraphs</p>
            {form.intro.paragraphs.map((item, index) => (
              <div key={`intro-paragraph-${index}`} className="flex items-start gap-2">
                <textarea
                  rows={3}
                  value={item}
                  onChange={(event) => updateIntroParagraph(index, event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeIntroParagraph(index)}
                  className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  title="Remove paragraph"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIntroParagraph}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <PlusIcon className="h-4 w-4" />
              Add Paragraph
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Highlights</h2>
          <button
            type="button"
            onClick={addHighlight}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>
        <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
          <button type="button" onClick={() => setHighlightsTab(TAB_ACTIVE)} className={`border-b-2 pb-2 text-sm font-medium ${highlightsTab === TAB_ACTIVE ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Active</button>
          <button type="button" onClick={() => setHighlightsTab(TAB_ARCHIVED)} className={`border-b-2 pb-2 text-sm font-medium ${highlightsTab === TAB_ARCHIVED ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Archived</button>
        </div>
        <div className="mt-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleListDragEnd('highlights', highlightsTab, event)}>
            <SortableContext items={visibleHighlights.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {visibleHighlights.map((item) => (
                  <SortableRow key={item.id} item={item} disabled={status === 'saving'}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={item.eyebrow} onChange={(event) => updateListItem('highlights', item.id, 'eyebrow', event.target.value)} placeholder="Eyebrow" className="h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-indigo-500" />
                      <input value={item.title} onChange={(event) => updateListItem('highlights', item.id, 'title', event.target.value)} placeholder="Title" className="h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-indigo-500" />
                      <input value={item.imageUrl} onChange={(event) => updateListItem('highlights', item.id, 'imageUrl', event.target.value)} placeholder="Image URL" className="h-9 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-indigo-500 md:col-span-2" />
                      <div className="md:col-span-2">
                        <ImageUrlPreview url={item.imageUrl} alt={`${item.title || 'Highlight'} preview`} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <DropdownSelect value={item.status} options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} onChange={(nextValue) => updateListItem('highlights', item.id, 'status', nextValue)} className="w-[180px]" />
                      <button type="button" onClick={() => removeHighlight(item.id)} className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  </SortableRow>
                ))}
                {visibleHighlights.length === 0 ? <p className="text-sm text-slate-500">No highlights.</p> : null}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Innovation Timeline</h2>
          <button type="button" onClick={openCreateTimelineDialog} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><PlusIcon className="h-4 w-4" />Add</button>
        </div>
        <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
          <button type="button" onClick={() => setTimelineTab(TAB_ACTIVE)} className={`border-b-2 pb-2 text-sm font-medium ${timelineTab === TAB_ACTIVE ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Active</button>
          <button type="button" onClick={() => setTimelineTab(TAB_ARCHIVED)} className={`border-b-2 pb-2 text-sm font-medium ${timelineTab === TAB_ARCHIVED ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Archived</button>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-12 gap-3 border-b border-slate-200 pb-2 pl-9 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <p className="col-span-12 md:col-span-2">Year</p>
            <p className="col-span-12 md:col-span-3">Title</p>
            <p className="col-span-12 md:col-span-5">Description</p>
            <p className="col-span-12 text-right md:col-span-2">Actions</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleListDragEnd('timeline', timelineTab, event)}>
            <SortableContext items={visibleTimeline.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-slate-200">
                {visibleTimeline.map((item, index) => (
                  <SortableTimelineItem
                    key={item.id}
                    item={item}
                    index={index}
                    total={visibleTimeline.length}
                    onEdit={openEditTimelineDialog}
                    onRemove={removeTimelineItem}
                    disabled={status === 'saving'}
                  />
                ))}
                {visibleTimeline.length === 0 ? <p className="text-sm text-slate-500">No timeline items.</p> : null}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Connect Info</h2>
        <div className="mt-4 grid gap-4">
          <FormField label="Section Title" required error={getFieldError('connectInfo.title')}>
            <input value={form.connectInfo.title} onChange={(event) => setForm((prev) => ({ ...prev, connectInfo: { ...prev.connectInfo, title: event.target.value } }))} onBlur={() => validateByFieldName('connectInfo.title')} className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500" />
          </FormField>
          <FormField label="Section Description" required error={getFieldError('connectInfo.description')}>
            <textarea rows={2} value={form.connectInfo.description} onChange={(event) => setForm((prev) => ({ ...prev, connectInfo: { ...prev.connectInfo, description: event.target.value } }))} onBlur={() => validateByFieldName('connectInfo.description')} className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500" />
          </FormField>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Offices</h3>
          <button type="button" onClick={openCreateOfficeDialog} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><PlusIcon className="h-4 w-4" />Add</button>
        </div>
        <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
          <button type="button" onClick={() => setOfficesTab(TAB_ACTIVE)} className={`border-b-2 pb-2 text-sm font-medium ${officesTab === TAB_ACTIVE ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Active</button>
          <button type="button" onClick={() => setOfficesTab(TAB_ARCHIVED)} className={`border-b-2 pb-2 text-sm font-medium ${officesTab === TAB_ARCHIVED ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Archived</button>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-12 gap-3 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <p className="col-span-12 md:col-span-2">Office</p>
            <p className="col-span-12 md:col-span-2">Phone</p>
            <p className="col-span-12 md:col-span-3">Email</p>
            <p className="col-span-12 md:col-span-3">Address</p>
            <p className="col-span-12 md:col-span-1">Status</p>
            <p className="col-span-12 text-right md:col-span-1">Actions</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleListDragEnd('offices', officesTab, event)}>
            <SortableContext items={visibleOffices.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-slate-200">
                {visibleOffices.map((item) => (
                  <SortableOfficeItem
                    key={item.id}
                    item={item}
                    onEdit={openEditOfficeDialog}
                    onRemove={removeOffice}
                    disabled={status === 'saving'}
                  />
                ))}
                {visibleOffices.length === 0 ? <p className="text-sm text-slate-500">No offices.</p> : null}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </section>

      {timelineDialog.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-2xl rounded-xl border border-indigo-300 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {timelineDialog.mode === 'create' ? 'Add Timeline Item' : 'Edit Timeline Item'}
                </h3>
                <p className="text-xs text-slate-500">Use this dialog to update timeline content.</p>
              </div>
              <button
                type="button"
                onClick={closeTimelineDialog}
                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                aria-label="Close timeline dialog"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="Year / Decade" required error={timelineDialogErrors.year || ''}>
                <DropdownSelect
                  value={timelineDialog.year}
                  options={timelineYearOptions}
                  onChange={(nextValue) =>
                    setTimelineDialog((prev) => ({
                      ...prev,
                      year: nextValue,
                    }))
                  }
                  onBlur={() => {
                    if (!timelineDialogErrors.year) return
                    validateTimelineDialog()
                  }}
                />
              </FormField>
              <FormField label="Status" required error={timelineDialogErrors.status || ''}>
                <DropdownSelect
                  value={timelineDialog.status}
                  options={[
                    { value: TAB_ACTIVE, label: 'Active' },
                    { value: TAB_ARCHIVED, label: 'Archived' },
                  ]}
                  onChange={(nextValue) =>
                    setTimelineDialog((prev) => ({
                      ...prev,
                      status: nextValue,
                    }))
                  }
                  onBlur={() => {
                    if (!timelineDialogErrors.status) return
                    validateTimelineDialog()
                  }}
                />
              </FormField>
              <FormField label="Title" required className="md:col-span-2" error={timelineDialogErrors.title || ''}>
                <input
                  value={timelineDialog.title}
                  onChange={(event) =>
                    setTimelineDialog((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (!timelineDialogErrors.title) return
                    validateTimelineDialog()
                  }}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Description" required className="md:col-span-2" error={timelineDialogErrors.description || ''}>
                <textarea
                  rows={4}
                  value={timelineDialog.description}
                  onChange={(event) =>
                    setTimelineDialog((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (!timelineDialogErrors.description) return
                    validateTimelineDialog()
                  }}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </FormField>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={closeTimelineDialog}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTimelineDialog}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {officeDialog.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-2xl rounded-xl border border-indigo-300 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {officeDialog.mode === 'create' ? 'Add Office' : 'Edit Office'}
                </h3>
                <p className="text-xs text-slate-500">Use this dialog to update office details.</p>
              </div>
              <button
                type="button"
                onClick={closeOfficeDialog}
                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                aria-label="Close office dialog"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="Office Name" required error={officeDialogErrors.name || ''}>
                <input
                  value={officeDialog.name}
                  onChange={(event) => setOfficeDialog((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Status" required error={officeDialogErrors.status || ''}>
                <DropdownSelect
                  value={officeDialog.status}
                  options={[
                    { value: TAB_ACTIVE, label: 'Active' },
                    { value: TAB_ARCHIVED, label: 'Archived' },
                  ]}
                  onChange={(nextValue) => setOfficeDialog((prev) => ({ ...prev, status: nextValue }))}
                />
              </FormField>
              <FormField label="Phone" required error={officeDialogErrors.phone || ''}>
                <input
                  value={officeDialog.phone}
                  onChange={(event) => setOfficeDialog((prev) => ({ ...prev, phone: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Phone href" error={officeDialogErrors.phoneHref || ''}>
                <input
                  value={officeDialog.phoneHref}
                  onChange={(event) => setOfficeDialog((prev) => ({ ...prev, phoneHref: event.target.value }))}
                  placeholder="tel:+123..."
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Email" required error={officeDialogErrors.email || ''}>
                <input
                  value={officeDialog.email}
                  onChange={(event) => setOfficeDialog((prev) => ({ ...prev, email: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Email href" error={officeDialogErrors.emailHref || ''}>
                <input
                  value={officeDialog.emailHref}
                  onChange={(event) => setOfficeDialog((prev) => ({ ...prev, emailHref: event.target.value }))}
                  placeholder="mailto:..."
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Address" required className="md:col-span-2" error={officeDialogErrors.address || ''}>
                <input
                  value={officeDialog.address}
                  onChange={(event) => setOfficeDialog((prev) => ({ ...prev, address: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={closeOfficeDialog}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOfficeDialog}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AboutUsPageEditor
