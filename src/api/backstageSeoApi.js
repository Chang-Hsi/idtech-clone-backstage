import { request, toAbsoluteUrl } from '../lib/request'

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

export async function fetchBackstageSeoScoreRecords({
  repository = 'Chang-Hsi/idtech-clone',
  pullRequestNumber = '',
  targetUrl = '',
  limit = 30,
  offset = 0,
} = {}) {
  const search = new URLSearchParams({
    repository: String(repository ?? '').trim() || 'Chang-Hsi/idtech-clone',
    limit: String(limit),
    offset: String(offset),
  })
  if (String(pullRequestNumber ?? '').trim()) {
    search.set('pullRequestNumber', String(pullRequestNumber).trim())
  }
  if (String(targetUrl ?? '').trim()) {
    search.set('targetUrl', String(targetUrl).trim())
  }
  return request(`/api/backstage/seo/score-records?${search.toString()}`, { cache: 'no-store' })
}

export async function triggerBackstageSeoLighthouseWorkflow({ force = false } = {}) {
  return request('/api/backstage/seo/score-records/trigger-lhci', {
    method: 'POST',
    body: JSON.stringify({ force: Boolean(force) }),
  })
}

export function getBackstageSeoScoreRecordsEventsUrl({ repository = 'Chang-Hsi/idtech-clone' } = {}) {
  const search = new URLSearchParams({
    repository: String(repository ?? '').trim() || 'Chang-Hsi/idtech-clone',
  })
  return toAbsoluteUrl(`/api/backstage/seo/score-records/events?${search.toString()}`)
}
