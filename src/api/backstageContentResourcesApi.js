import { request } from '../lib/request'

export async function fetchBackstageResources({ limit = 10, offset = 0, q = '', status = 'active' }) {
  const search = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    q: q.trim(),
    status,
  })
  return request(`/api/backstage/content/resources?${search.toString()}`, { cache: 'no-store' })
}

export async function fetchBackstageResourceBySlug(slug) {
  return request(`/api/backstage/content/resources/${slug}`, { cache: 'no-store' })
}

export async function createBackstageResource(payload) {
  return request('/api/backstage/content/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageResource(slug, payload) {
  return request(`/api/backstage/content/resources/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function archiveBackstageResource(slug, updatedBy) {
  return request(`/api/backstage/content/resources/${slug}/archive`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function restoreBackstageResource(slug, updatedBy) {
  return request(`/api/backstage/content/resources/${slug}/restore`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}
