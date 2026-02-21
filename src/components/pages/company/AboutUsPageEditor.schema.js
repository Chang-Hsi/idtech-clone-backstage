import {
  customRule,
  emailRule,
  enumRule,
  phoneLooseRule,
  requiredRule,
  safeLabelRule,
  urlLikeRule,
} from '../../../utils/validation/rules'
import { isRequired } from '../../../utils/formValidation'

const TAB_ACTIVE = 'active'
const TAB_ARCHIVED = 'archived'

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
    'emailHref',
  )

export const buildAboutUsPageValidationSchema = (form) => {
  const schema = [
    {
      name: 'intro.title',
      rules: [requiredRule('Intro title is required.')],
    },
    {
      name: 'intro.imageUrl',
      rules: [
        requiredRule('Intro image URL is required.'),
        urlLikeRule('Intro image URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'intro.paragraphs',
      rules: [
        customRule(
          (value) =>
            Array.isArray(value) && value.some((item) => String(item ?? '').trim().length > 0)
              ? ''
              : 'Intro requires at least one paragraph.',
          'introParagraphs',
        ),
      ],
    },
    {
      name: 'highlights',
      rules: [
        customRule(
          (value) => (Array.isArray(value) && value.length > 0 ? '' : 'At least one highlight is required.'),
          'highlightsLength',
        ),
      ],
    },
    {
      name: 'innovationTimeline.items',
      rules: [
        customRule(
          (value) =>
            Array.isArray(value) && value.length > 0
              ? ''
              : 'At least one innovation timeline item is required.',
          'timelineLength',
        ),
      ],
    },
    {
      name: 'connectInfo.title',
      rules: [requiredRule('Connect Info title is required.')],
    },
    {
      name: 'connectInfo.description',
      rules: [requiredRule('Connect Info description is required.')],
    },
    {
      name: 'connectInfo.offices',
      rules: [
        customRule(
          (value) => (Array.isArray(value) && value.length > 0 ? '' : 'At least one office is required.'),
          'officesLength',
        ),
      ],
    },
  ]

  const highlights = Array.isArray(form?.highlights) ? form.highlights : []
  for (const [index, item] of highlights.entries()) {
    const itemLabel = `Highlight ${index + 1}`
    schema.push({
      name: `highlights.${item.id}.eyebrow`,
      valuePath: `highlights.${index}.eyebrow`,
      rules: [requiredRule(`${itemLabel}: eyebrow is required.`)],
    })
    schema.push({
      name: `highlights.${item.id}.title`,
      valuePath: `highlights.${index}.title`,
      rules: [requiredRule(`${itemLabel}: title is required.`)],
    })
    schema.push({
      name: `highlights.${item.id}.imageUrl`,
      valuePath: `highlights.${index}.imageUrl`,
      rules: [
        requiredRule(`${itemLabel}: image URL is required.`),
        urlLikeRule(`${itemLabel}: image URL must be absolute or a valid relative path.`),
      ],
    })
    schema.push({
      name: `highlights.${item.id}.status`,
      valuePath: `highlights.${index}.status`,
      rules: [enumRule([TAB_ACTIVE, TAB_ARCHIVED], `${itemLabel}: status is invalid.`)],
    })
  }

  const timelineItems = Array.isArray(form?.innovationTimeline?.items) ? form.innovationTimeline.items : []
  for (const [index, item] of timelineItems.entries()) {
    const itemLabel = `Timeline item ${index + 1}`
    schema.push({
      name: `innovationTimeline.items.${item.id}.year`,
      valuePath: `innovationTimeline.items.${index}.year`,
      rules: [requiredRule(`${itemLabel}: year/decade is required.`)],
    })
    schema.push({
      name: `innovationTimeline.items.${item.id}.title`,
      valuePath: `innovationTimeline.items.${index}.title`,
      rules: [requiredRule(`${itemLabel}: title is required.`)],
    })
    schema.push({
      name: `innovationTimeline.items.${item.id}.description`,
      valuePath: `innovationTimeline.items.${index}.description`,
      rules: [requiredRule(`${itemLabel}: description is required.`)],
    })
    schema.push({
      name: `innovationTimeline.items.${item.id}.status`,
      valuePath: `innovationTimeline.items.${index}.status`,
      rules: [enumRule([TAB_ACTIVE, TAB_ARCHIVED], `${itemLabel}: status is invalid.`)],
    })
  }

  const offices = Array.isArray(form?.connectInfo?.offices) ? form.connectInfo.offices : []
  for (const [index, item] of offices.entries()) {
    const itemLabel = `Office ${index + 1}`
    schema.push({
      name: `connectInfo.offices.${item.id}.name`,
      valuePath: `connectInfo.offices.${index}.name`,
      rules: [
        requiredRule(`${itemLabel}: name is required.`),
        safeLabelRule(`${itemLabel}: name has unsupported special characters.`),
      ],
    })
    schema.push({
      name: `connectInfo.offices.${item.id}.phone`,
      valuePath: `connectInfo.offices.${index}.phone`,
      rules: [
        requiredRule(`${itemLabel}: phone is required.`),
        phoneLooseRule(`${itemLabel}: phone format is invalid.`),
      ],
    })
    schema.push({
      name: `connectInfo.offices.${item.id}.phoneHref`,
      valuePath: `connectInfo.offices.${index}.phoneHref`,
      rules: [phoneHrefRule(`${itemLabel}: phone href must start with tel:, mailto:, http(s), / or #.`)],
    })
    schema.push({
      name: `connectInfo.offices.${item.id}.email`,
      valuePath: `connectInfo.offices.${index}.email`,
      rules: [
        requiredRule(`${itemLabel}: email is required.`),
        emailRule(`${itemLabel}: email format is invalid.`),
      ],
    })
    schema.push({
      name: `connectInfo.offices.${item.id}.emailHref`,
      valuePath: `connectInfo.offices.${index}.emailHref`,
      rules: [emailHrefRule(`${itemLabel}: email href should start with mailto:.`)],
    })
    schema.push({
      name: `connectInfo.offices.${item.id}.address`,
      valuePath: `connectInfo.offices.${index}.address`,
      rules: [requiredRule(`${itemLabel}: address is required.`)],
    })
    schema.push({
      name: `connectInfo.offices.${item.id}.status`,
      valuePath: `connectInfo.offices.${index}.status`,
      rules: [enumRule([TAB_ACTIVE, TAB_ARCHIVED], `${itemLabel}: status is invalid.`)],
    })
  }

  return schema
}
