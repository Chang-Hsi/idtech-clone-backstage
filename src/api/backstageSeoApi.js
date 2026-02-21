import { request } from '../lib/request'

export async function fetchBackstageSeoTargets({
  q = '',
  source = 'all',
  type = 'all',
  limit = 80,
  offset = 0,
} = {}) {
  const search = new URLSearchParams({
    q: String(q ?? '').trim(),
    source: String(source ?? 'all').trim(),
    type: String(type ?? 'all').trim(),
    limit: String(limit),
    offset: String(offset),
  })
  return request(`/api/backstage/seo/targets?${search.toString()}`, { cache: 'no-store' })
}

export async function fetchBackstageSeoTargetDetail(targetKey) {
  const encoded = encodeURIComponent(String(targetKey ?? '').trim())
  return request(`/api/backstage/seo/targets/${encoded}`, { cache: 'no-store' })
}

export async function updateBackstageSeoTarget(targetKey, payload) {
  const encoded = encodeURIComponent(String(targetKey ?? '').trim())
  return request(`/api/backstage/seo/targets/${encoded}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function resetBackstageSeoTargetFallback(targetKey, payload = {}) {
  const encoded = encodeURIComponent(String(targetKey ?? '').trim())
  return request(`/api/backstage/seo/targets/${encoded}/reset-fallback`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
