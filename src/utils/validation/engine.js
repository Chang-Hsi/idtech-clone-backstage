const getPathSegments = (name) => String(name ?? '').split('.').filter(Boolean)

export const getValueAtPath = (values, name) => {
  const segments = getPathSegments(name)
  let cursor = values

  for (const segment of segments) {
    if (cursor == null) return undefined
    cursor = cursor[segment]
  }

  return cursor
}

export const validateSchemaField = (schema, values, fieldName) => {
  const fieldConfig = schema.find((item) => item.name === fieldName)
  if (!fieldConfig) return ''

  const value = getValueAtPath(values, fieldConfig.valuePath || fieldName)

  for (const rule of fieldConfig.rules || []) {
    const message = rule.validate(value, values, fieldConfig)
    if (message) return message
  }

  return ''
}

export const validateSchema = (schema, values) => {
  const errorMap = {}

  for (const fieldConfig of schema) {
    const value = getValueAtPath(values, fieldConfig.valuePath || fieldConfig.name)

    for (const rule of fieldConfig.rules || []) {
      const message = rule.validate(value, values, fieldConfig)
      if (message) {
        errorMap[fieldConfig.name] = message
        break
      }
    }
  }

  return {
    valid: Object.keys(errorMap).length === 0,
    errorMap,
    errors: Object.values(errorMap),
  }
}
