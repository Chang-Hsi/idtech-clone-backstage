const AUTH_STORAGE_KEY = 'idtech_backstage_auth'

export const readAuthFromStorage = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.isAuthenticated) return null
    return parsed
  } catch {
    return null
  }
}

export const writeAuthToStorage = (value) => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value))
}

export const clearAuthFromStorage = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export const AUTH_STORAGE_KEY_NAME = AUTH_STORAGE_KEY
