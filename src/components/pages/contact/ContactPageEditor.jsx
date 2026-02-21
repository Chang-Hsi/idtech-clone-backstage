import { useEffect, useMemo, useState } from 'react'
import { Bars3Icon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../../../features/auth/AuthProvider'
import FormField from '../../common/FormField'
import DropdownSelect from '../../common/DropdownSelect'
import StatusMessage from '../../common/StatusMessage'
import {
  fetchBackstageContactPage,
  updateBackstageContactPage,
} from '../../../api/backstageContactPageApi'
import useFormValidation from '../../../hooks/useFormValidation'
import {
  INQUIRY_TYPE_OPTIONS,
  buildContactValidationSchema,
} from './ContactPageEditor.schema'
import { validateSchema, validateSchemaField } from '../../../utils/validation/engine'
import { allowsSafeLabelChars, isRequired } from '../../../utils/formValidation'

const CONTACT_ROW_TYPES = ['phone', 'email']
const REGIONAL_ROW_TYPES = ['phone', 'email', 'address']
const FIXED_INFO_GROUPS = [
  { id: 'hq', heading: 'Headquarters' },
  { id: 'support', heading: 'Support' },
]

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const createFixedInfoGroup = (groupId, heading) => ({
  id: groupId,
  heading,
  rows: CONTACT_ROW_TYPES.map((type) => ({
    id: `${groupId}-${type}`,
    type,
    text: '',
    href: '',
  })),
})

const createFixedRegionalCard = (id = createId('card')) => ({
  id,
  region: '',
  rows: REGIONAL_ROW_TYPES.map((type) => ({
    id: `${id}-${type}`,
    type,
    text: '',
    href: '',
  })),
})

const createEmptyInquiryOption = () => ({
  _id: createId('inquiry'),
  name: '',
  type: INQUIRY_TYPE_OPTIONS[0].value,
})

const buildInitialForm = () => ({
  hero: {
    eyebrow: '',
    title: '',
    description: '',
    imageUrl: '',
    imageAlt: '',
    infoGroups: FIXED_INFO_GROUPS.map((item) => createFixedInfoGroup(item.id, item.heading)),
  },
  addressSection: {
    title: '',
    description: '',
  },
  regionalCards: [createFixedRegionalCard('card-1')],
  formContent: {
    heading: '',
    description: '',
    messageMinLength: 10,
  },
  inquiryOptions: [createEmptyInquiryOption()],
})

const buildFixedInfoGroups = (incomingInfoGroups) => {
  const source = Array.isArray(incomingInfoGroups) ? incomingInfoGroups : []

  return FIXED_INFO_GROUPS.map((fixed) => {
    const rawGroup = source.find((group) => group?.id === fixed.id)
    const rawRows = Array.isArray(rawGroup?.rows) ? rawGroup.rows : []

    return {
      id: fixed.id,
      heading: fixed.heading,
      rows: CONTACT_ROW_TYPES.map((type) => {
        const rawRow = rawRows.find((row) => row?.type === type)
        return {
          id: rawRow?.id || `${fixed.id}-${type}`,
          type,
          text: rawRow?.text ?? '',
          href: rawRow?.href ?? '',
        }
      }),
    }
  })
}

const buildFixedRegionalCards = (incomingCards) => {
  const cards = Array.isArray(incomingCards) ? incomingCards : []
  if (cards.length === 0) return [createFixedRegionalCard('card-1')]

  return cards.map((card) => {
    const id = card?.id || createId('card')
    const rawRows = Array.isArray(card?.rows) ? card.rows : []

    return {
      id,
      region: card?.region ?? '',
      rows: REGIONAL_ROW_TYPES.map((type) => {
        const rawRow = rawRows.find((row) => row?.type === type)
        return {
          id: rawRow?.id || `${id}-${type}`,
          type,
          text: rawRow?.text ?? '',
          href: rawRow?.href ?? '',
        }
      }),
    }
  })
}

const normalizeInquiryOptions = (options) => {
  const source = Array.isArray(options) ? options : []
  if (source.length === 0) return [createEmptyInquiryOption()]

  return source.map((option) => ({
    _id: createId('inquiry'),
    name: option?.label ?? '',
    type: option?.value ?? INQUIRY_TYPE_OPTIONS[0].value,
  }))
}

const slugifyValue = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const buildRegionOptionsFromCards = (cards) => {
  const seen = new Set()
  const options = []

  for (const card of cards) {
    const label = card?.region?.trim() ?? ''
    if (!label) continue

    const value = slugifyValue(label)
    if (!value || seen.has(value)) continue

    seen.add(value)
    options.push({ value, label })
  }

  return options
}

const mapContactPageToForm = (contactPage) => ({
  hero: {
    eyebrow: contactPage?.hero?.eyebrow ?? '',
    title: contactPage?.hero?.title ?? '',
    description: contactPage?.hero?.description ?? '',
    imageUrl: contactPage?.hero?.imageUrl ?? '',
    imageAlt: contactPage?.hero?.imageAlt ?? '',
    infoGroups: buildFixedInfoGroups(contactPage?.hero?.infoGroups),
  },
  addressSection: {
    title: contactPage?.addressSection?.title ?? '',
    description: contactPage?.addressSection?.description ?? '',
  },
  regionalCards: buildFixedRegionalCards(contactPage?.regionalCards),
  formContent: {
    heading: contactPage?.formContent?.heading ?? '',
    description: contactPage?.formContent?.description ?? '',
    messageMinLength: Number(contactPage?.formContent?.messageMinLength ?? 10),
  },
  inquiryOptions: normalizeInquiryOptions(contactPage?.inquiryOptions),
})

const toPayload = (form) => ({
  hero: {
    ...form.hero,
    infoGroups: FIXED_INFO_GROUPS.map((fixed) => {
      const group =
        form.hero.infoGroups.find((item) => item.id === fixed.id) ||
        createFixedInfoGroup(fixed.id, fixed.heading)

      return {
        id: fixed.id,
        heading: fixed.heading,
        rows: CONTACT_ROW_TYPES.map((type) => {
          const row = group.rows.find((item) => item.type === type)
          return {
            id: row?.id || `${fixed.id}-${type}`,
            type,
            text: row?.text ?? '',
            href: row?.href?.trim() ? row.href.trim() : undefined,
          }
        }),
      }
    }),
  },
  addressSection: form.addressSection,
  regionalCards: form.regionalCards.map((card) => ({
    id: card.id,
    region: card.region,
    rows: REGIONAL_ROW_TYPES.map((type) => {
      const row = card.rows.find((item) => item.type === type)
      return {
        id: row?.id || `${card.id}-${type}`,
        type,
        text: row?.text ?? '',
        href: row?.href?.trim() ? row.href.trim() : undefined,
      }
    }),
  })),
  formContent: {
    ...form.formContent,
    messageMinLength: Number(form.formContent.messageMinLength || 1),
  },
  inquiryOptions: form.inquiryOptions.map((option) => ({
    label: option.name,
    value: option.type,
  })),
  regionOptions: buildRegionOptionsFromCards(form.regionalCards),
})

const getPreviewStatusText = (status) => {
  if (status === 'loading') return 'Loading preview...'
  if (status === 'error') return 'Image failed to load'
  if (status === 'idle') return 'No image URL'
  return ''
}

const SortableInquiryRow = ({ item, index, onEdit, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const typeLabel = INQUIRY_TYPE_OPTIONS.find((option) => option.value === item.type)?.label || item.type

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-t border-slate-200 ${isDragging ? 'bg-indigo-50/50' : ''}`}
    >
      <td className="px-3 py-2 align-middle">
        <button
          type="button"
          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:cursor-grabbing"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <Bars3Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
      <td className="px-3 py-2 align-middle text-slate-500">{index + 1}</td>
      <td className="px-3 py-2 align-middle font-medium text-slate-900">{item.name}</td>
      <td className="px-3 py-2 align-middle text-slate-600">{typeLabel}</td>
      <td className="px-3 py-2 align-middle text-center">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
          aria-label="Edit inquiry option"
          title="Edit"
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
      <td className="px-3 py-2 align-middle text-center">
        <button
          type="button"
          onClick={() => onRemove(item._id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
          aria-label="Delete inquiry option"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  )
}

const ContactPageEditor = () => {
  const { user } = useAuth()
  const { clearAll, getFieldError, validateField, validateMany } = useFormValidation()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [updatedBy, setUpdatedBy] = useState('')
  const [form, setForm] = useState(buildInitialForm)
  const [activeInfoTab, setActiveInfoTab] = useState('hq')
  const [activeRegionalTab, setActiveRegionalTab] = useState('card-1')

  const [heroPreviewUrl, setHeroPreviewUrl] = useState('')
  const [heroPreviewStatus, setHeroPreviewStatus] = useState('idle')

  const [inquiryDialog, setInquiryDialog] = useState({
    isOpen: false,
    mode: 'create',
    targetId: '',
    name: '',
    type: INQUIRY_TYPE_OPTIONS[0].value,
  })
  const [inquiryDialogNameError, setInquiryDialogNameError] = useState('')

  const validationSchema = useMemo(() => buildContactValidationSchema(form), [form])

  const validateByFieldName = (fieldName) => {
    return validateField(fieldName, () => validateSchemaField(validationSchema, form, fieldName))
  }

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      setErrorMessage('')
      setValidationErrors([])
      setSuccessMessage('')

      try {
        const payload = await fetchBackstageContactPage()
        if (!payload.contactPage) throw new Error('Contact page content not found')

        const nextForm = mapContactPageToForm(payload.contactPage)
        setForm(nextForm)
        setActiveRegionalTab(nextForm.regionalCards[0]?.id ?? 'card-1')
        setUpdatedAt(payload.updatedAt ?? '')
        setUpdatedBy(payload.updatedBy ?? '')
        setStatus('success')
        clearAll()
      } catch (error) {
        setStatus('error')
        setErrorMessage(error.message || 'Unable to load contact page data.')
      }
    }

    load()
  }, [clearAll])

  useEffect(() => {
    const nextValue = form.hero.imageUrl.trim()

    const timerId = window.setTimeout(() => {
      setHeroPreviewUrl(nextValue)
      if (!nextValue) setHeroPreviewStatus('idle')
    }, 500)

    return () => window.clearTimeout(timerId)
  }, [form.hero.imageUrl])

  useEffect(() => {
    if (!heroPreviewUrl) {
      setHeroPreviewStatus('idle')
      return
    }

    setHeroPreviewStatus('loading')

    let isActive = true
    const img = new Image()

    img.onload = () => {
      if (!isActive) return
      setHeroPreviewStatus('loaded')
    }

    img.onerror = () => {
      if (!isActive) return
      setHeroPreviewStatus('error')
    }

    img.src = heroPreviewUrl

    return () => {
      isActive = false
      img.onload = null
      img.onerror = null
    }
  }, [heroPreviewUrl])

  const updateHeroField = (field, value) => {
    setForm((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }))
  }

  const updateAddressField = (field, value) => {
    setForm((prev) => ({ ...prev, addressSection: { ...prev.addressSection, [field]: value } }))
  }

  const updateFormContentField = (field, value) => {
    setForm((prev) => ({ ...prev, formContent: { ...prev.formContent, [field]: value } }))
  }

  const updateFixedInfoRow = (groupId, rowType, field, value) => {
    setForm((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        infoGroups: prev.hero.infoGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                rows: group.rows.map((row) =>
                  row.type === rowType ? { ...row, [field]: value } : row
                ),
              }
            : group
        ),
      },
    }))
  }

  const addRegionalCard = () => {
    const card = createFixedRegionalCard()
    setForm((prev) => ({ ...prev, regionalCards: [...prev.regionalCards, card] }))
    setActiveRegionalTab(card.id)
  }

  const removeRegionalCard = (cardId) => {
    let nextActiveId = 'card-1'

    setForm((prev) => {
      const nextCards = prev.regionalCards.filter((card) => card.id !== cardId)
      const safeCards = nextCards.length > 0 ? nextCards : [createFixedRegionalCard('card-1')]
      nextActiveId = safeCards[0]?.id ?? 'card-1'
      return { ...prev, regionalCards: safeCards }
    })

    setActiveRegionalTab((current) => (current === cardId ? nextActiveId : current))
  }

  const updateRegionalCardField = (cardId, field, value) => {
    setForm((prev) => ({
      ...prev,
      regionalCards: prev.regionalCards.map((card) =>
        card.id === cardId ? { ...card, [field]: value } : card
      ),
    }))
  }

  const updateRegionalFixedRow = (cardId, rowType, field, value) => {
    setForm((prev) => ({
      ...prev,
      regionalCards: prev.regionalCards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              rows: card.rows.map((row) =>
                row.type === rowType ? { ...row, [field]: value } : row
              ),
            }
          : card
      ),
    }))
  }

  const openCreateInquiryDialog = () => {
    setInquiryDialogNameError('')
    setInquiryDialog({
      isOpen: true,
      mode: 'create',
      targetId: '',
      name: '',
      type: INQUIRY_TYPE_OPTIONS[0].value,
    })
  }

  const openEditInquiryDialog = (item) => {
    setInquiryDialogNameError('')
    setInquiryDialog({
      isOpen: true,
      mode: 'edit',
      targetId: item._id,
      name: item.name,
      type: item.type,
    })
  }

  const closeInquiryDialog = () => {
    setInquiryDialogNameError('')
    setInquiryDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const validateInquiryDialogName = (value) => {
    const normalizedName = String(value ?? '').trim()
    if (!isRequired(normalizedName)) return 'Name is required.'
    if (!allowsSafeLabelChars(normalizedName)) return 'Name has unsupported special characters.'
    return ''
  }

  const saveInquiryDialog = () => {
    const normalizedName = inquiryDialog.name.trim()
    const dialogNameError = validateInquiryDialogName(normalizedName)
    if (dialogNameError) {
      setInquiryDialogNameError(dialogNameError)
      return
    }

    if (inquiryDialog.mode === 'create') {
      setForm((prev) => ({
        ...prev,
        inquiryOptions: [
          ...prev.inquiryOptions,
          {
            _id: createId('inquiry'),
            name: normalizedName,
            type: inquiryDialog.type,
          },
        ],
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        inquiryOptions: prev.inquiryOptions.map((option) =>
          option._id === inquiryDialog.targetId
            ? {
                ...option,
                name: normalizedName,
                type: inquiryDialog.type,
              }
            : option
        ),
      }))
    }

    closeInquiryDialog()
  }

  const removeInquiryOption = (optionId) => {
    setForm((prev) => {
      const nextOptions = prev.inquiryOptions.filter((option) => option._id !== optionId)
      return {
        ...prev,
        inquiryOptions: nextOptions.length > 0 ? nextOptions : [createEmptyInquiryOption()],
      }
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleInquiryDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setForm((prev) => {
      const oldIndex = prev.inquiryOptions.findIndex((item) => item._id === active.id)
      const newIndex = prev.inquiryOptions.findIndex((item) => item._id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return {
        ...prev,
        inquiryOptions: arrayMove(prev.inquiryOptions, oldIndex, newIndex),
      }
    })
  }

  const save = async () => {
    const quickValid = validateMany(
      validationSchema.map((field) => ({
        name: field.name,
        validate: () => validateSchemaField(validationSchema, form, field.name),
      }))
    )
    const validation = validateSchema(validationSchema, form)
    if (!quickValid || !validation.valid) {
      setStatus('error')
      setErrorMessage('Please fix the validation errors before saving.')
      setValidationErrors(validation.errors)
      setSuccessMessage('')
      return
    }

    setStatus('saving')
    setErrorMessage('')
    setValidationErrors([])
    setSuccessMessage('')

    try {
      const payload = await updateBackstageContactPage({
        ...toPayload(form),
        updatedBy: editorId,
      })

      if (!payload.contactPage) throw new Error('Unable to save contact page')

      const nextForm = mapContactPageToForm(payload.contactPage)
      setForm(nextForm)
      setActiveRegionalTab(nextForm.regionalCards[0]?.id ?? 'card-1')
      setUpdatedAt(payload.updatedAt ?? '')
      setUpdatedBy(payload.updatedBy ?? editorId)
      setStatus('success')
      setSuccessMessage('Contact page saved successfully.')
      setValidationErrors([])
      clearAll()
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save contact page.')
    }
  }

  const activeInfoGroup =
    form.hero.infoGroups.find((group) => group.id === activeInfoTab) ?? form.hero.infoGroups[0]

  const activeRegionalCard =
    form.regionalCards.find((card) => card.id === activeRegionalTab) ?? form.regionalCards[0]

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contact Page Manager</h1>
          {updatedAt ? (
            <p className="mt-1 text-xs text-slate-400">
              Last updated: {new Date(updatedAt).toLocaleString()}
              {updatedBy ? ` by ${updatedBy}` : ''}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={status === 'loading' || status === 'saving'}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>
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

      {status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading Contact page data...
        </div>
      ) : (
        <>
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Hero</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Eyebrow"
                required
                error={getFieldError('hero.eyebrow')}
              >
                <input
                  value={form.hero.eyebrow}
                  onChange={(event) => updateHeroField('eyebrow', event.target.value)}
                  onBlur={() => validateByFieldName('hero.eyebrow')}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField
                label="Title"
                required
                error={getFieldError('hero.title')}
              >
                <input
                  value={form.hero.title}
                  onChange={(event) => updateHeroField('title', event.target.value)}
                  onBlur={() => validateByFieldName('hero.title')}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>

              <FormField
                label="Description"
                required
                className="md:col-span-2"
                error={getFieldError('hero.description')}
              >
                <textarea
                  rows={3}
                  value={form.hero.description}
                  onChange={(event) => updateHeroField('description', event.target.value)}
                  onBlur={() => validateByFieldName('hero.description')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </FormField>

              <FormField
                label="Image URL"
                required
                error={getFieldError('hero.imageUrl')}
              >
                <input
                  value={form.hero.imageUrl}
                  onChange={(event) => updateHeroField('imageUrl', event.target.value)}
                  onBlur={() => validateByFieldName('hero.imageUrl')}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField
                label="Image Alt"
                required
                error={getFieldError('hero.imageAlt')}
              >
                <input
                  value={form.hero.imageAlt}
                  onChange={(event) => updateHeroField('imageAlt', event.target.value)}
                  onBlur={() => validateByFieldName('hero.imageAlt')}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>

              <div className="space-y-2 text-sm md:col-span-2">
                <p className="font-medium text-slate-700">Background Preview</p>
                <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {heroPreviewStatus === 'loaded' ? (
                    <img
                      src={heroPreviewUrl}
                      alt={form.hero.imageAlt || 'Hero background preview'}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center text-xs font-medium text-slate-500">
                      {getPreviewStatusText(heroPreviewStatus)}
                    </div>
                  )}
                </div>
                
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-5 border-b border-slate-200">
                {FIXED_INFO_GROUPS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveInfoTab(item.id)}
                    className={`border-b-2 pb-2 text-sm font-medium ${
                      activeInfoTab === item.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {item.heading}
                  </button>
                ))}
              </div>

              {activeInfoGroup ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {CONTACT_ROW_TYPES.map((rowType) => {
                    const row = activeInfoGroup.rows.find((item) => item.type === rowType)
                    return (
                      <div
                        key={`${activeInfoGroup.id}-${rowType}`}
                        className="space-y-2 rounded-md border border-slate-200 p-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {rowType}
                        </p>
                        <input
                          value={row?.text ?? ''}
                          onChange={(event) =>
                            updateFixedInfoRow(activeInfoGroup.id, rowType, 'text', event.target.value)
                          }
                          onBlur={() =>
                            validateByFieldName(
                              `hero.infoGroups.${activeInfoGroup.id}.${rowType}.text`
                            )
                          }
                          placeholder="Display text"
                          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                        />
                        {getFieldError(`hero.infoGroups.${activeInfoGroup.id}.${rowType}.text`) ? (
                          <p className="text-xs text-red-600">
                            {getFieldError(`hero.infoGroups.${activeInfoGroup.id}.${rowType}.text`)}
                          </p>
                        ) : null}
                        <input
                          value={row?.href ?? ''}
                          onChange={(event) =>
                            updateFixedInfoRow(activeInfoGroup.id, rowType, 'href', event.target.value)
                          }
                          placeholder="href"
                          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Regional Contact Points</h2>
              <button
                type="button"
                onClick={addRegionalCard}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Add Card
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Section Title"
                required
                className="md:col-span-2"
                error={getFieldError('addressSection.title')}
              >
                <input
                  value={form.addressSection.title}
                  onChange={(event) => updateAddressField('title', event.target.value)}
                  onBlur={() => validateByFieldName('addressSection.title')}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField
                label="Section Description"
                required
                className="md:col-span-2"
                error={getFieldError('addressSection.description')}
              >
                <textarea
                  rows={3}
                  value={form.addressSection.description}
                  onChange={(event) => updateAddressField('description', event.target.value)}
                  onBlur={() => validateByFieldName('addressSection.description')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </FormField>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200">
                <div className="flex items-center gap-5 overflow-x-auto pr-2">
                  {form.regionalCards.map((card, index) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setActiveRegionalTab(card.id)}
                      className={`border-b-2 pb-2 text-sm font-medium whitespace-nowrap ${
                        activeRegionalTab === card.id
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {card.region?.trim() || `Card ${index + 1}`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRegionalCard}
                  className="mb-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                  aria-label="Add Region"
                  title="Add Region"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {activeRegionalCard ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <FormField
                      label="Region"
                      required
                      className="w-full"
                      error={getFieldError(`regionalCards.${activeRegionalCard.id}.region.text`)}
                    >
                      <input
                        value={activeRegionalCard.region}
                        onChange={(event) =>
                          updateRegionalCardField(activeRegionalCard.id, 'region', event.target.value)
                        }
                        onBlur={() =>
                          validateByFieldName(`regionalCards.${activeRegionalCard.id}.region.text`)
                        }
                        className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                      />
                    </FormField>
                    <button
                      type="button"
                      onClick={() => removeRegionalCard(activeRegionalCard.id)}
                      className="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      aria-label="Remove Card"
                      title="Remove Card"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {REGIONAL_ROW_TYPES.map((rowType) => {
                      const row = activeRegionalCard.rows.find((item) => item.type === rowType)
                      return (
                        <div
                          key={`${activeRegionalCard.id}-${rowType}`}
                          className="space-y-2 rounded-md border border-slate-200 p-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {rowType}
                          </p>
                          <input
                            value={row?.text ?? ''}
                            onChange={(event) =>
                              updateRegionalFixedRow(activeRegionalCard.id, rowType, 'text', event.target.value)
                            }
                            onBlur={() =>
                              validateByFieldName(
                                `regionalCards.${activeRegionalCard.id}.${rowType}.text`
                              )
                            }
                            placeholder="Display text"
                            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                          />
                          {getFieldError(`regionalCards.${activeRegionalCard.id}.${rowType}.text`) ? (
                            <p className="text-xs text-red-600">
                              {getFieldError(`regionalCards.${activeRegionalCard.id}.${rowType}.text`)}
                            </p>
                          ) : null}
                          <input
                            value={row?.href ?? ''}
                            onChange={(event) =>
                              updateRegionalFixedRow(activeRegionalCard.id, rowType, 'href', event.target.value)
                            }
                            placeholder="href (optional)"
                            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Form Content</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Heading"
                required
                className="md:col-span-2"
                error={getFieldError('formContent.heading')}
              >
                <input
                  value={form.formContent.heading}
                  onChange={(event) => updateFormContentField('heading', event.target.value)}
                  onBlur={() => validateByFieldName('formContent.heading')}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField
                label="Description"
                required
                className="md:col-span-2"
                error={getFieldError('formContent.description')}
              >
                <textarea
                  rows={3}
                  value={form.formContent.description}
                  onChange={(event) => updateFormContentField('description', event.target.value)}
                  onBlur={() => validateByFieldName('formContent.description')}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </FormField>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Inquiry Options</h3>
                <button
                  type="button"
                  onClick={openCreateInquiryDialog}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                  aria-label="Add Inquiry Option"
                  title="Add Inquiry Option"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="-mx-3 overflow-x-auto px-3">
                <table className="min-w-full w-full table-auto border-collapse text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-[44px] px-3 py-2">
                        <span className="sr-only">Drag</span>
                      </th>
                      <th className="w-[60px] px-3 py-2">ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="w-[80px] px-3 py-2 text-center">Edit</th>
                      <th className="w-[80px] px-3 py-2 text-center">Delete</th>
                    </tr>
                  </thead>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleInquiryDragEnd}>
                    <SortableContext items={form.inquiryOptions.map((item) => item._id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {form.inquiryOptions.map((item, index) => (
                          <SortableInquiryRow
                            key={item._id}
                            item={item}
                            index={index}
                            onEdit={openEditInquiryDialog}
                            onRemove={removeInquiryOption}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </DndContext>
                </table>
              </div>
            </div>
          </section>
        </>
      )}

      {inquiryDialog.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900">
              {inquiryDialog.mode === 'create' ? 'Add Inquiry Option' : 'Edit Inquiry Option'}
            </h3>

            <div className="mt-4 space-y-3">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">
                  Name<span className="ml-1 text-red-500">*</span>
                </span>
                <input
                  value={inquiryDialog.name}
                  onChange={(event) => {
                    setInquiryDialog((prev) => ({ ...prev, name: event.target.value }))
                    if (inquiryDialogNameError) setInquiryDialogNameError('')
                  }}
                  onBlur={(event) => setInquiryDialogNameError(validateInquiryDialogName(event.target.value))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
                {inquiryDialogNameError ? (
                  <p className="text-xs text-red-600">{inquiryDialogNameError}</p>
                ) : null}
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Type</span>
                <DropdownSelect
                  value={inquiryDialog.type}
                  options={INQUIRY_TYPE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  onChange={(nextValue) => setInquiryDialog((prev) => ({ ...prev, type: nextValue }))}
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeInquiryDialog}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveInquiryDialog}
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

export default ContactPageEditor
