import { customRule, requiredRule, urlLikeRule } from '../../../utils/validation/rules'

export const buildHomeHeroDrawerSchema = ({ layoutPreset }) => {
  const schema = [
    { name: 'id', rules: [requiredRule('Slide ID is required.')] },
    { name: 'title', rules: [requiredRule('Title is required.')] },
    { name: 'desc', rules: [requiredRule('Description is required.')] },
    { name: 'primaryCta.label', rules: [requiredRule('Primary CTA label is required.')] },
    { name: 'primaryCta.to', rules: [requiredRule('Primary CTA link is required.')] },
    {
      name: 'background.imageUrl',
      rules: [
        requiredRule('Background image URL is required.'),
        urlLikeRule('Background image URL must be an absolute URL or a valid relative path.'),
      ],
    },
    {
      name: 'background.overlayOpacity',
      rules: [
        customRule((value) => {
          const normalized = Number(value)
          if (Number.isNaN(normalized)) return 'Overlay opacity must be a number between 0 and 1.'
          if (normalized < 0 || normalized > 1) return 'Overlay opacity must be between 0 and 1.'
          return ''
        }, 'overlayOpacityRange'),
      ],
    },
  ]

  if (layoutPreset === 'split') {
    schema.push({
      name: 'foregroundImageUrl',
      rules: [
        requiredRule('Foreground image URL is required for split layout.'),
        urlLikeRule('Foreground image URL must be an absolute URL or a valid relative path.'),
      ],
    })
  }

  return schema
}
