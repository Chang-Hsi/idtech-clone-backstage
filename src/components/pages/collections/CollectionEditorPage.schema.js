import { customRule, enumRule, requiredRule, safeLabelRule, urlLikeRule } from '../../../utils/validation/rules'

export const buildCollectionEditorValidationSchema = () => {
  return [
    {
      name: 'name',
      rules: [
        requiredRule('Name is required.'),
        safeLabelRule('Name has unsupported special characters.'),
      ],
    },
    {
      name: 'heroTitle',
      rules: [requiredRule('Hero Title is required.')],
    },
    {
      name: 'heroSubtitle',
      rules: [requiredRule('Hero Subtitle is required.')],
    },
    {
      name: 'intro',
      rules: [requiredRule('Intro is required.')],
    },
    {
      name: 'imageUrl',
      rules: [
        requiredRule('Background Image URL is required.'),
        urlLikeRule('Background Image URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'status',
      rules: [enumRule(['active', 'archived'], 'Status is invalid.')],
    },
    {
      name: 'linkedProductSlugs',
      rules: [
        customRule((value) => {
          if (!Array.isArray(value)) return 'Linked Products payload is invalid.'
          const uniqueSize = new Set(value).size
          return uniqueSize === value.length ? '' : 'Linked Products contains duplicate entries.'
        }, 'linkedProductUnique'),
      ],
    },
  ]
}
