import { request } from '../lib/request'

export async function loginBackstage(payload) {
  return request('/api/backstage/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logoutBackstage() {
  return request('/api/backstage/auth/logout', {
    method: 'POST',
  })
}

export async function fetchBackstageMe() {
  return request('/api/backstage/auth/me', {
    cache: 'no-store',
  })
}
