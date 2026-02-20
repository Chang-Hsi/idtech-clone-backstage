const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
