import { request } from '../lib/request'

export async function fetchBackstageHomePage({ includeArchived = false } = {}) {
  const query = includeArchived ? '?includeArchived=true' : ''
  const payload = await request(`/api/backstage/pages/home${query}`, { cache: 'no-store' })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    homePage: data?.homePage ?? null,
    updatedAt: data?.updatedAt ?? null,
  }
}

export async function updateBackstageHomePage({ heroSlides, updatedBy }) {
  const payload = await request('/api/backstage/pages/home', {
    method: 'PUT',
    body: JSON.stringify({ heroSlides, updatedBy }),
  })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    homePage: data?.homePage ?? null,
    updatedAt: data?.updatedAt ?? null,
  }
}
