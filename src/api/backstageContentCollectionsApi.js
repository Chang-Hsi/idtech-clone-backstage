import { request } from '../lib/request'

export async function fetchBackstageCollections({ limit = 10, offset = 0, q = '', status = 'active' }) {
  const search = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    q: q.trim(),
    status,
  })
  return request(`/api/backstage/content/collections?${search.toString()}`, { cache: 'no-store' })
}

export async function fetchBackstageCollectionBySlug(slug) {
  return request(`/api/backstage/content/collections/${slug}`, { cache: 'no-store' })
}

export async function createBackstageCollection(payload) {
  return request('/api/backstage/content/collections', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageCollection(slug, payload) {
  return request(`/api/backstage/content/collections/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function archiveBackstageCollection(slug, updatedBy) {
  return request(`/api/backstage/content/collections/${slug}/archive`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function restoreBackstageCollection(slug, updatedBy) {
  return request(`/api/backstage/content/collections/${slug}/restore`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function fetchBackstageProductOptions(q = '') {
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
