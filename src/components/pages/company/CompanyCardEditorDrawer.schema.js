import { enumRule, requiredRule, safeLabelRule, urlLikeRule } from '../../../utils/validation/rules'

export const buildCompanyCardEditorSchema = () => [
  {
    name: 'title',
    rules: [requiredRule('Title is required.'), safeLabelRule('Title has unsupported special characters.')],
  },
  {
    name: 'description',
    rules: [requiredRule('Description is required.')],
  },
  {
    name: 'to',
    rules: [requiredRule('Link path is required.')],
  },
  {
    name: 'imageUrl',
    rules: [requiredRule('Image URL is required.'), urlLikeRule('Image URL must be an absolute URL or a valid relative path.')],
  },
  {
    name: 'status',
    rules: [enumRule(['active', 'archived'], 'Status is invalid.')],
  },
]
