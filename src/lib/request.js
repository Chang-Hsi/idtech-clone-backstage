const DEFAULT_API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://idtech-clone-api.onrender.com'
    : 'http://localhost:4000'

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  DEFAULT_API_BASE_URL

const AUTH_WHITELIST_PATHS = new Set(['/api/backstage/auth/login', '/api/backstage/auth/me'])

let unauthorizedHandler = null
let lastUnauthorizedNotifiedAt = 0

export const toAbsoluteUrl = (path) => {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

const toErrorPayload = async (response) => {
  try {
    const payload = await response.json()
    return {
      code: Number(payload?.code),
      message: payload?.message || `Request failed (${response.status})`,
      details: payload?.error?.details ?? null,
    }
  } catch {
    return {
      code: null,
      message: `Request failed (${response.status})`,
      details: null,
    }
  }
}

const shouldNotifyUnauthorized = (path, options = {}) => {
  if (options?.skipUnauthorizedHandler) return false
  if (AUTH_WHITELIST_PATHS.has(path)) return false
  return true
}

const notifyUnauthorized = ({ path, status, message }) => {
  const now = Date.now()
  // Prevent a burst of parallel 401 responses from firing duplicate logout handlers.
  if (now - lastUnauthorizedNotifiedAt < 1000) return
  lastUnauthorizedNotifiedAt = now

  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler({ path, status, message })
  }
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

export async function request(path, options = {}) {
  const isFormDataPayload =
    typeof FormData !== 'undefined' &&
    options?.body instanceof FormData
  const mergedHeaders = {
    ...(options.headers ?? {}),
  }
  if (!isFormDataPayload && !('Content-Type' in mergedHeaders) && !('content-type' in mergedHeaders)) {
    mergedHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(toAbsoluteUrl(path), {
    credentials: 'include',
    headers: mergedHeaders,
    ...options,
  })

  if (!response.ok) {
    const errorPayload = await toErrorPayload(response)

    if (response.status === 401 && shouldNotifyUnauthorized(path, options)) {
      notifyUnauthorized({ path, status: response.status, message: errorPayload.message })
    }

    const error = new Error(errorPayload.message)
    error.status = response.status
    error.code = errorPayload.code
    error.details = errorPayload.details
    throw error
  }

  return response.json()
}
