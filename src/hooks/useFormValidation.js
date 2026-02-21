import { useCallback, useState } from 'react'

export default function useFormValidation() {
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})

  const touchField = useCallback((name) => {
    if (!name) return
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
  }, [])

  const setFieldError = useCallback((name, errorMessage = '') => {
    if (!name) return
    setErrors((prev) => {
      const next = { ...prev }
      if (errorMessage) {
        next[name] = errorMessage
      } else {
        delete next[name]
      }
      return next
    })
  }, [])

  const validateField = useCallback(
    (name, validate) => {
      touchField(name)
      const message = typeof validate === 'function' ? validate() : ''
      setFieldError(name, message)
      return !message
    },
    [setFieldError, touchField]
  )

  const validateMany = useCallback(
    (rules) => {
      if (!Array.isArray(rules) || rules.length === 0) return true

      const nextTouched = {}
      const nextErrors = {}

      for (const rule of rules) {
        if (!rule?.name || typeof rule.validate !== 'function') continue
        nextTouched[rule.name] = true
        const message = rule.validate()
        if (message) nextErrors[rule.name] = message
      }

      setTouched((prev) => ({ ...prev, ...nextTouched }))
      setErrors(nextErrors)
      return Object.keys(nextErrors).length === 0
    },
    []
  )

  const clearAll = useCallback(() => {
    setTouched({})
    setErrors({})
  }, [])

  const getFieldError = useCallback(
    (name) => {
      if (!name || !touched[name]) return ''
      return errors[name] || ''
    },
    [errors, touched]
  )

  return {
    touched,
    errors,
    touchField,
    setFieldError,
    validateField,
    validateMany,
    getFieldError,
    clearAll,
  }
}
