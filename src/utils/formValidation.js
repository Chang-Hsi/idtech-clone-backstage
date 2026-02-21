export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Loose international phone format: +, digits, spaces, parentheses, dots, hyphens.
export const PHONE_LOOSE_REGEX = /^[+]?[-.()\s\d]{6,30}$/

const DIGIT_REGEX = /\d/g

export function isRequired(value) {
  return String(value ?? '').trim().length > 0
}

export function hasMinLength(value, min) {
  return String(value ?? '').trim().length >= min
}

export function isEmail(value) {
  const normalized = String(value ?? '').trim()
  return EMAIL_REGEX.test(normalized)
}

export function isPhoneLoose(value, minDigits = 6) {
  const normalized = String(value ?? '').trim()
  if (!PHONE_LOOSE_REGEX.test(normalized)) return false
  const digits = normalized.match(DIGIT_REGEX) ?? []
  return digits.length >= minDigits
}

export function isInteger(value) {
  if (value === '' || value === null || value === undefined) return false
  return Number.isInteger(Number(value))
}

export function isPositiveInteger(value) {
  if (!isInteger(value)) return false
  return Number(value) > 0
}

export function allowsSafeLabelChars(value) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return false
  return /^[\p{L}\p{N}\s&/(),.'-]+$/u.test(normalized)
}

export function isUrlLike(value) {
  const normalized = String(value ?? '').trim()
  return /^(https?:\/\/|\/|\.\/|\.\.\/)/.test(normalized)
}
