import { customRule, emailRule, requiredRule, urlLikeRule } from '../../../utils/validation/rules'

export const buildCareersJobEditorValidationSchema = (allowedCountryCodes = []) => {
  const allowedCountrySet = new Set((allowedCountryCodes ?? []).map((code) => String(code ?? '').trim().toLowerCase()).filter(Boolean))

  return [
    {
      name: 'title',
      rules: [requiredRule('Title is required.')],
    },
    {
      name: 'region',
      rules: [requiredRule('Region is required.')],
    },
    {
      name: 'countryCode',
      rules: [
        requiredRule('countryCode is required.'),
        customRule((value) => {
          const next = String(value ?? '').trim().toLowerCase()
          if (!next) return ''
          return allowedCountrySet.has(next) ? '' : 'countryCode must match an existing tab key.'
        }, 'countryCodeExists'),
      ],
    },
    {
      name: 'employmentType',
      rules: [requiredRule('Employment Type is required.')],
    },
    {
      name: 'locationLabel',
      rules: [requiredRule('Location Label is required.')],
    },
    {
      name: 'imageUrl',
      rules: [
        requiredRule('Image URL is required.'),
        urlLikeRule('Image URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'summary',
      rules: [requiredRule('Summary is required.')],
    },
    {
      name: 'applyEmail',
      rules: [requiredRule('Apply Email is required.'), emailRule('Apply Email format is invalid.')],
    },
    {
      name: 'isOpen',
      rules: [
        customRule((value) => (typeof value === 'boolean' ? '' : 'Status is invalid.'), 'statusBoolean'),
      ],
    },
    {
      name: 'jobDutiesMarkdown',
      rules: [requiredRule('Job Duties is required.')],
    },
    {
      name: 'qualificationsMarkdown',
      rules: [requiredRule('Qualifications is required.')],
    },
  ]
}
