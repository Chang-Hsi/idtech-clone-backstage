import { requiredRule, urlLikeRule } from '../../../utils/validation/rules'

export const buildBannerHubRowEditorSchema = ({ tab }) => {
  const schema = [
    { name: 'eyebrow', rules: [requiredRule('Eyebrow is required.')] },
    { name: 'title', rules: [requiredRule('Title is required.')] },
    { name: 'description', rules: [requiredRule('Description is required.')] },
  ]

  if (tab === 'detail' || tab === 'product') {
    schema.push({
      name: 'backgroundImageUrl',
      rules: [
        requiredRule('Background Image URL is required.'),
        urlLikeRule('Background Image URL must be an absolute URL or a valid relative path.'),
      ],
    })
  }

  return schema
}
