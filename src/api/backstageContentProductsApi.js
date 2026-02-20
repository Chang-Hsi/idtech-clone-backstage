import { request } from '../lib/request'

export async function fetchBackstageProducts({
  limit = 10,
  offset = 0,
  q = '',
  status = 'active',
  collectionSlug = '',
  useCaseSlug = '',
}) {
  const search = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    q: q.trim(),
    status,
    collectionSlug,
    useCaseSlug,
  })
  return request(`/api/backstage/content/products?${search.toString()}`, { cache: 'no-store' })
}

export async function fetchBackstageProductBySlug(slug) {
  return request(`/api/backstage/content/products/${slug}`, { cache: 'no-store' })
}

export async function createBackstageProduct(payload) {
  return request('/api/backstage/content/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageProduct(slug, payload) {
  return request(`/api/backstage/content/products/${slug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function archiveBackstageProduct(slug, updatedBy) {
  return request(`/api/backstage/content/products/${slug}/archive`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}

export async function restoreBackstageProduct(slug, updatedBy) {
  return request(`/api/backstage/content/products/${slug}/restore`, {
    method: 'POST',
    body: JSON.stringify({ updatedBy }),
  })
}
