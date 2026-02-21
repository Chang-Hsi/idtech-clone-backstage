import { isRequired } from '../../../utils/formValidation'
import {
  customRule,
  enumRule,
  requiredRule,
  safeLabelRule,
  urlLikeRule,
} from '../../../utils/validation/rules'

const DATASHEET_MIME_ALLOWED = ['application/pdf']

export const buildProductEditorValidationSchema = (form) => {
  const datasheetName = String(form?.downloads?.datasheetName ?? '').trim()
  const datasheetUrl = String(form?.downloads?.datasheetUrl ?? '').trim()
  const datasheetMimeType = String(form?.downloads?.datasheetMimeType ?? '').trim()
  const hasAnyDatasheetField = Boolean(datasheetName || datasheetUrl || datasheetMimeType)

  return [
    {
      name: 'name',
      rules: [
        requiredRule('Name is required.'),
        safeLabelRule('Name has unsupported special characters.'),
      ],
    },
    {
      name: 'shortDescription',
      rules: [requiredRule('Short Description is required.')],
    },
    {
      name: 'status',
      rules: [enumRule(['active', 'archived'], 'Status is invalid.')],
    },
    {
      name: 'media.heroImageUrl',
      rules: [
        requiredRule('Hero Image URL is required.'),
        urlLikeRule('Hero Image URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'detail.heroEyebrow',
      rules: [requiredRule('Hero Eyebrow is required.')],
    },
    {
      name: 'detail.heroDescription',
      rules: [requiredRule('Hero Description is required.')],
    },
    {
      name: 'detail.heroImageUrl',
      rules: [
        requiredRule('Detail Hero Image URL is required.'),
        urlLikeRule('Detail Hero Image URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'downloads.datasheetName',
      rules: [
        customRule(
          (value) => {
            if (!hasAnyDatasheetField) return ''
            return isRequired(value) ? '' : 'Datasheet Name is required when downloads are configured.'
          },
          'datasheetNameRequiredWhenPresent'
        ),
      ],
    },
    {
      name: 'downloads.datasheetUrl',
      rules: [
        customRule(
          (value) => {
            if (!hasAnyDatasheetField) return ''
            if (!isRequired(value)) return 'Datasheet URL is required when downloads are configured.'
            return ''
          },
          'datasheetUrlRequiredWhenPresent'
        ),
        urlLikeRule('Datasheet URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'downloads.datasheetMimeType',
      rules: [
        customRule(
          (value) => {
            if (!hasAnyDatasheetField) return ''
            if (!isRequired(value)) return 'Datasheet Mime Type is required when downloads are configured.'
            return DATASHEET_MIME_ALLOWED.includes(String(value).trim())
              ? ''
              : 'Datasheet Mime Type must be application/pdf.'
          },
          'datasheetMimeTypeRule'
        ),
      ],
    },
  ]
}
