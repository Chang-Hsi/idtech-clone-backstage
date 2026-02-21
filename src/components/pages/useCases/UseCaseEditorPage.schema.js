import { customRule, enumRule, requiredRule, urlLikeRule } from '../../../utils/validation/rules'

export const buildUseCaseEditorValidationSchema = () => {
  return [
    {
      name: 'title',
      rules: [requiredRule('Title is required.')],
    },
    {
      name: 'subtitle',
      rules: [requiredRule('Subtitle is required.')],
    },
    {
      name: 'description',
      rules: [requiredRule('Description is required.')],
    },
    {
      name: 'heroImageUrl',
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
