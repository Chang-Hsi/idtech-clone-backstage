import {
  customRule,
  enumRule,
  requiredRule,
  urlLikeRule,
} from '../../../utils/validation/rules'

export const SEO_TYPE_OPTIONS = ['website', 'article', 'product']
export const ROBOTS_OPTIONS = ['index,follow', 'noindex,nofollow']

const maxLengthRule = (max, message) =>
  customRule((value) => {
    const text = String(value ?? '')
    return text.length <= max ? '' : message
  }, `max-length-${max}`)

export const seoEditorSchema = [
  {
    name: 'seo.title',
    valuePath: 'seo.title',
    rules: [
      requiredRule('Page title is required.'),
      maxLengthRule(60, 'Page title should be 60 characters or fewer.'),
    ],
  },
  {
    name: 'seo.description',
    valuePath: 'seo.description',
    rules: [
      requiredRule('Meta description is required.'),
      maxLengthRule(160, 'Meta description should be 160 characters or fewer.'),
    ],
  },
  {
    name: 'seo.canonicalPath',
    valuePath: 'seo.canonicalPath',
    rules: [
      requiredRule('Canonical path is required.'),
      customRule(
        (value) => (String(value ?? '').startsWith('/') ? '' : 'Canonical path must start with "/".'),
        'canonical-path',
      ),
    ],
  },
  {
    name: 'seo.ogImageUrl',
    valuePath: 'seo.ogImageUrl',
    rules: [urlLikeRule('OG image URL must be a valid URL.')],
  },
  {
    name: 'seo.type',
    valuePath: 'seo.type',
    rules: [
      requiredRule('SEO type is required.'),
      enumRule(SEO_TYPE_OPTIONS, 'Unsupported SEO type.'),
    ],
  },
  {
    name: 'seo.robots',
    valuePath: 'seo.robots',
    rules: [
      requiredRule('Robots is required.'),
      enumRule(ROBOTS_OPTIONS, 'Unsupported robots value.'),
    ],
  },
]
