import { request, toAbsoluteUrl } from '../lib/request'

export async function fetchBackstageSubmissions({
  source = 'all',
  status = 'all',
  keyword = '',
  dateFrom = '',
  dateTo = '',
  page = 1,
  pageSize = 20,
} = {}) {
  const search = new URLSearchParams({
    source: String(source ?? 'all').trim() || 'all',
    status: String(status ?? 'all').trim() || 'all',
    keyword: String(keyword ?? '').trim(),
    dateFrom: String(dateFrom ?? '').trim(),
    dateTo: String(dateTo ?? '').trim(),
    page: String(page),
    pageSize: String(pageSize),
  })
  return request(`/api/backstage/submissions?${search.toString()}`, { cache: 'no-store' })
}

export async function fetchBackstageSubmissionDetail(submissionId) {
  return request(`/api/backstage/submissions/${Number(submissionId)}`, { cache: 'no-store' })
}

export async function updateBackstageSubmissionStatus(submissionId, { status, note = '' }) {
  return request(`/api/backstage/submissions/${Number(submissionId)}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      status: String(status ?? '').trim(),
      note: String(note ?? '').trim(),
    }),
  })
}

export async function archiveBackstageSubmission(submissionId, { note = '' } = {}) {
  return request(`/api/backstage/submissions/${Number(submissionId)}/archive`, {
    method: 'POST',
    body: JSON.stringify({
      note: String(note ?? '').trim(),
    }),
  })
}

export async function restoreBackstageSubmission(submissionId, { note = '' } = {}) {
  return request(`/api/backstage/submissions/${Number(submissionId)}/restore`, {
    method: 'POST',
    body: JSON.stringify({
      note: String(note ?? '').trim(),
    }),
  })
}

export function getBackstageSubmissionResumeDownloadUrl(submissionId) {
  const normalizedSubmissionId = Number.parseInt(String(submissionId ?? ''), 10)
  if (!Number.isInteger(normalizedSubmissionId) || normalizedSubmissionId <= 0) return ''
  return toAbsoluteUrl(`/api/backstage/submissions/${normalizedSubmissionId}/resume`)
}
