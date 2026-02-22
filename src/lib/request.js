const DEFAULT_API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://idtech-clone-api.onrender.com'
    : 'http://localhost:4000'

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  DEFAULT_API_BASE_URL

const toAbsoluteUrl = (path) => {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

const toErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    if (payload?.message) return payload.message
  } catch {
    // no-op
  }
  return `Request failed (${response.status})`
}

export async function request(path, options = {}) {
  const response = await fetch(toAbsoluteUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(await toErrorMessage(response))
  }

  return response.json()
}
