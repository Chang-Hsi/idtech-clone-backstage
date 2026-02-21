import { request } from '../lib/request'

export async function fetchBackstageCompanyCareers() {
  return request('/api/backstage/content/company/careers', { cache: 'no-store' })
}

export async function updateBackstageCompanyCareers(payload) {
  return request('/api/backstage/content/company/careers', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
