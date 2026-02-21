import { request } from '../lib/request'

export async function fetchBackstageCompanyAboutUs() {
  return request('/api/backstage/content/company/about-us', { cache: 'no-store' })
}

export async function updateBackstageCompanyAboutUs(payload) {
  return request('/api/backstage/content/company/about-us', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
