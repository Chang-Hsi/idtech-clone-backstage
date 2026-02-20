import { request } from '../lib/request'

export async function fetchBackstagePrivacyPolicyPage() {
  return request('/api/backstage/pages/legal/privacy-policy', { cache: 'no-store' })
}

export async function updateBackstagePrivacyPolicyPage(payload) {
  return request('/api/backstage/pages/legal/privacy-policy', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
