import {
  allowsSafeLabelChars,
  isEmail,
  isPhoneLoose,
  isRequired,
  isUrlLike,
} from '../formValidation'

export const requiredRule = (message) => ({
  key: 'required',
  validate: (value) => (isRequired(value) ? '' : message),
})

export const emailRule = (message) => ({
  key: 'email',
  validate: (value) => {
    if (!isRequired(value)) return ''
    return isEmail(value) ? '' : message
  },
})

export const phoneLooseRule = (message) => ({
  key: 'phone',
  validate: (value) => {
    if (!isRequired(value)) return ''
    return isPhoneLoose(value) ? '' : message
  },
})

export const urlLikeRule = (message) => ({
  key: 'urlLike',
  validate: (value) => {
    if (!isRequired(value)) return ''
    return isUrlLike(value) ? '' : message
  },
})

export const safeLabelRule = (message) => ({
  key: 'safeLabel',
  validate: (value) => {
    if (!isRequired(value)) return ''
    return allowsSafeLabelChars(value) ? '' : message
  },
})

export const enumRule = (allowedValues, message) => {
  const allowed = new Set(allowedValues)
  return {
    key: 'enum',
    validate: (value) => (allowed.has(String(value ?? '').trim()) ? '' : message),
  }
}

export const customRule = (validate, key = 'custom') => ({
  key,
  validate,
})
