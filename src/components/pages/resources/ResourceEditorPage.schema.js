import { customRule, enumRule, requiredRule, urlLikeRule } from '../../../utils/validation/rules'

const DATE_YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/

const getNestedValue = (values, path) => path.split('.').reduce((acc, segment) => acc?.[segment], values)

const atLeastOneLocaleRule = (peerPath, message, key) =>
  customRule((value, values) => {
    const self = String(value ?? '').trim()
    const peer = String(getNestedValue(values, peerPath) ?? '').trim()
    return self || peer ? '' : message
  }, key)

export const buildResourceEditorValidationSchema = () => [
  {
    name: 'coverImageUrl',
    rules: [
      requiredRule('Cover Image URL is required.'),
      urlLikeRule('Cover Image URL must be an absolute URL or a valid relative path.'),
    ],
  },
  {
    name: 'publishedAt',
    rules: [
      requiredRule('Published At is required.'),
      customRule(
        (value) =>
          DATE_YMD_REGEX.test(String(value ?? '').trim())
            ? ''
            : 'Published At must use YYYY-MM-DD format.',
        'publishedAtFormat',
      ),
    ],
  },
  {
    name: 'status',
    rules: [enumRule(['active', 'archived'], 'Status is invalid.')],
  },
  {
    name: 'title.en',
    rules: [atLeastOneLocaleRule('title.zh', 'Title requires at least one locale (en or zh).', 'titleEnOrZh')],
  },
  {
    name: 'title.zh',
    rules: [atLeastOneLocaleRule('title.en', 'Title requires at least one locale (en or zh).', 'titleZhOrEn')],
  },
  {
    name: 'excerpt.en',
    rules: [
      atLeastOneLocaleRule(
        'excerpt.zh',
        'Excerpt requires at least one locale (en or zh).',
        'excerptEnOrZh',
      ),
    ],
  },
  {
    name: 'excerpt.zh',
    rules: [
      atLeastOneLocaleRule(
        'excerpt.en',
        'Excerpt requires at least one locale (en or zh).',
        'excerptZhOrEn',
      ),
    ],
  },
  {
    name: 'contentMarkdown.en',
    rules: [
      atLeastOneLocaleRule(
        'contentMarkdown.zh',
        'Markdown content requires at least one locale (en or zh).',
        'contentEnOrZh',
      ),
    ],
  },
  {
    name: 'contentMarkdown.zh',
    rules: [
      atLeastOneLocaleRule(
        'contentMarkdown.en',
        'Markdown content requires at least one locale (en or zh).',
        'contentZhOrEn',
      ),
    ],
  },
]
