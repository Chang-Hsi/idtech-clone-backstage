import { request } from '../lib/request'

export async function fetchBackstageCompanyCards({ q = '', status = 'active' } = {}) {
  const search = new URLSearchParams({
    q: q.trim(),
    status,
  })
  return request(`/api/backstage/content/company/cards?${search.toString()}`, { cache: 'no-store' })
}

export async function createBackstageCompanyCard(payload) {
  return request('/api/backstage/content/company/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageCompanyCard(id, payload) {
  return request(`/api/backstage/content/company/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function archiveBackstageCompanyCard(id, updatedBy) {
  return request(`/api/backstage/content/company/cards/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function restoreBackstageCompanyCard(id, updatedBy) {
  return request(`/api/backstage/content/company/cards/${id}/restore`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function reorderBackstageCompanyCards({ status, orderedIds, updatedBy }) {
  return request('/api/backstage/content/company/cards/reorder', {
    method: 'POST',
    body: JSON.stringify({ status, orderedIds, updatedBy }),
  })
}
