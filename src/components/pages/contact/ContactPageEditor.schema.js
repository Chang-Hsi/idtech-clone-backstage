import { isRequired } from '../../../utils/formValidation'
import {
  customRule,
  emailRule,
  enumRule,
  phoneLooseRule,
  requiredRule,
  safeLabelRule,
  urlLikeRule,
} from '../../../utils/validation/rules'

const isHrefAllowed = (href) => {
  if (!href) return true
  return /^(tel:|mailto:|https?:\/\/|\/|#)/i.test(String(href).trim())
}

const phoneHrefRule = (message) =>
  customRule((value) => (isHrefAllowed(value) ? '' : message), 'phoneHref')

const emailHrefRule = (message) =>
  customRule(
    (value) => {
      if (!isRequired(value)) return ''
      return String(value).trim().startsWith('mailto:') ? '' : message
    },
    'emailHref'
  )

const addressHrefRule = (message) =>
  customRule((value) => (isHrefAllowed(value) ? '' : message), 'addressHref')

export const INQUIRY_TYPE_OPTIONS = [
  { value: 'sales', label: 'Sales Inquiry' },
  { value: 'technical-support', label: 'Technical Support' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
]

export const buildContactValidationSchema = (form) => {
  const schema = [
    {
      name: 'hero.eyebrow',
      rules: [requiredRule('Hero Eyebrow is required.')],
    },
    {
      name: 'hero.title',
      rules: [requiredRule('Hero Title is required.')],
    },
    {
      name: 'hero.description',
      rules: [requiredRule('Hero Description is required.')],
    },
    {
      name: 'hero.imageUrl',
      rules: [
        requiredRule('Hero Image URL is required.'),
        urlLikeRule('Hero Image URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'hero.imageAlt',
      rules: [requiredRule('Hero Image Alt is required.')],
    },
    {
      name: 'addressSection.title',
      rules: [requiredRule('Regional Contact section title is required.')],
    },
    {
      name: 'addressSection.description',
      rules: [requiredRule('Regional Contact section description is required.')],
    },
    {
      name: 'formContent.heading',
      rules: [requiredRule('Form heading is required.')],
    },
    {
      name: 'formContent.description',
      rules: [requiredRule('Form description is required.')],
    },
    {
      name: 'regionalCards',
      rules: [
        customRule(
          (value) =>
            Array.isArray(value) && value.length > 0
              ? ''
              : 'At least one Regional Contact card is required.',
          'regionalCardsLength'
        ),
      ],
    },
    {
      name: 'inquiryOptions',
      rules: [
        customRule(
          (value) =>
            Array.isArray(value) && value.length > 0 ? '' : 'At least one Inquiry Option is required.',
          'inquiryOptionsLength'
        ),
      ],
    },
  ]

  const infoGroups = Array.isArray(form?.hero?.infoGroups) ? form.hero.infoGroups : []
  for (const [groupIndex, group] of infoGroups.entries()) {
    const heading = group?.heading || group?.id || 'Unknown group'

    schema.push({
      name: `hero.infoGroups.${group.id}.phone.text`,
      valuePath: `hero.infoGroups.${groupIndex}.rows.0.text`,
      rules: [
        requiredRule(`${heading}: phone text is required.`),
        phoneLooseRule(`${heading}: phone format is invalid.`),
      ],
    })

    schema.push({
      name: `hero.infoGroups.${group.id}.phone.href`,
      valuePath: `hero.infoGroups.${groupIndex}.rows.0.href`,
      rules: [phoneHrefRule(`${heading}: phone href must start with tel:, mailto:, http(s), / or #.`)],
    })

    schema.push({
      name: `hero.infoGroups.${group.id}.email.text`,
      valuePath: `hero.infoGroups.${groupIndex}.rows.1.text`,
      rules: [
        requiredRule(`${heading}: email text is required.`),
        emailRule(`${heading}: email format is invalid.`),
      ],
    })

    schema.push({
      name: `hero.infoGroups.${group.id}.email.href`,
      valuePath: `hero.infoGroups.${groupIndex}.rows.1.href`,
      rules: [emailHrefRule(`${heading}: email href should start with mailto:.`)],
    })
  }

  const regionalCards = Array.isArray(form?.regionalCards) ? form.regionalCards : []
  for (const [index, card] of regionalCards.entries()) {
    const cardLabel = card?.region?.trim() || `Card ${index + 1}`

    schema.push({
      name: `regionalCards.${card.id}.region.text`,
      valuePath: `regionalCards.${index}.region`,
      rules: [
        requiredRule(`Regional ${cardLabel}: region name is required.`),
        safeLabelRule(`Regional ${cardLabel}: region has unsupported special characters.`),
      ],
    })

    schema.push({
      name: `regionalCards.${card.id}.phone.text`,
      valuePath: `regionalCards.${index}.rows.0.text`,
      rules: [
        requiredRule(`Regional ${cardLabel}: phone text is required.`),
        phoneLooseRule(`Regional ${cardLabel}: phone format is invalid.`),
      ],
    })

    schema.push({
      name: `regionalCards.${card.id}.phone.href`,
      valuePath: `regionalCards.${index}.rows.0.href`,
      rules: [phoneHrefRule(`Regional ${cardLabel}: phone href must start with tel:, mailto:, http(s), / or #.`)],
    })

    schema.push({
      name: `regionalCards.${card.id}.email.text`,
      valuePath: `regionalCards.${index}.rows.1.text`,
      rules: [
        requiredRule(`Regional ${cardLabel}: email text is required.`),
        emailRule(`Regional ${cardLabel}: email format is invalid.`),
      ],
    })

    schema.push({
      name: `regionalCards.${card.id}.email.href`,
      valuePath: `regionalCards.${index}.rows.1.href`,
      rules: [emailHrefRule(`Regional ${cardLabel}: email href should start with mailto:.`)],
    })

    schema.push({
      name: `regionalCards.${card.id}.address.text`,
      valuePath: `regionalCards.${index}.rows.2.text`,
      rules: [requiredRule(`Regional ${cardLabel}: address text is required.`)],
    })

    schema.push({
      name: `regionalCards.${card.id}.address.href`,
      valuePath: `regionalCards.${index}.rows.2.href`,
      rules: [addressHrefRule(`Regional ${cardLabel}: address href format is invalid.`)],
    })
  }

  const inquiryOptions = Array.isArray(form?.inquiryOptions) ? form.inquiryOptions : []
  const allowedTypes = INQUIRY_TYPE_OPTIONS.map((item) => item.value)
  const nameCounts = inquiryOptions.reduce((acc, option) => {
    const key = String(option?.name ?? '').trim().toLowerCase()
    if (!key) return acc
    acc.set(key, (acc.get(key) ?? 0) + 1)
    return acc
  }, new Map())

  for (const [index, option] of inquiryOptions.entries()) {
    const optionLabel = `Inquiry Option ${index + 1}`
    const nameKey = String(option?.name ?? '').trim().toLowerCase()

    schema.push({
      name: `inquiryOptions.${option?._id || index}.name`,
      valuePath: `inquiryOptions.${index}.name`,
      rules: [
        requiredRule(`${optionLabel}: name is required.`),
        safeLabelRule(`${optionLabel}: name has unsupported special characters.`),
        customRule(() => {
          if (!nameKey) return ''
          return (nameCounts.get(nameKey) ?? 0) > 1
            ? `${optionLabel}: duplicate name is not allowed.`
            : ''
        }, 'duplicateName'),
      ],
    })

    schema.push({
      name: `inquiryOptions.${option?._id || index}.type`,
      valuePath: `inquiryOptions.${index}.type`,
      rules: [enumRule(allowedTypes, `${optionLabel}: type is invalid.`)],
    })
  }

  return schema
}
