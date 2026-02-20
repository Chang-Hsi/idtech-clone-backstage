import { request } from '../lib/request'

export async function fetchBackstageUseCases({ limit = 10, offset = 0, q = '', status = 'active' }) {
  const search = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    q: q.trim(),
    status,
  })
  return request(`/api/backstage/content/use-cases?${search.toString()}`, { cache: 'no-store' })
}

export async function fetchBackstageUseCaseBySlug(slug) {
  return request(`/api/backstage/content/use-cases/${slug}`, { cache: 'no-store' })
}

export async function createBackstageUseCase(payload) {
  return request('/api/backstage/content/use-cases', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageUseCase(slug, payload) {
  return request(`/api/backstage/content/use-cases/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function archiveBackstageUseCase(slug, updatedBy) {
  return request(`/api/backstage/content/use-cases/${slug}/archive`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function restoreBackstageUseCase(slug, updatedBy) {
  return request(`/api/backstage/content/use-cases/${slug}/restore`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function fetchBackstageUseCaseProductOptions(q = '') {
  const search = new URLSearchParams({
    limit: '100',
    offset: '0',
    q: q.trim(),
    status: 'all',
  })
  const payload = await request(`/api/backstage/content/products?${search.toString()}`, { cache: 'no-store' })
  const items = Array.isArray(payload?.data?.items) ? payload.data.items : []
  return {
    code: payload?.code ?? 0,
    message: payload?.message ?? 'success',
    data: {
      items: items.map((item) => ({
        value: item.slug,
        label: item.name,
        imageUrl: item.imageUrl ?? '',
      })),
    },
  }
}
