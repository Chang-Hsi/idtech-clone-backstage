import { request } from '../lib/request'
import { uploadBackstageImage } from './backstageUploadsApi'

export async function fetchBackstageSettings() {
  return request('/api/backstage/settings', { cache: 'no-store' })
}

export async function updateBackstageSettingsProfile(payload) {
  return request('/api/backstage/settings/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageSettingsPassword(payload) {
  return request('/api/backstage/settings/profile/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageSettingsRoles(payload) {
  return request('/api/backstage/settings/roles', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateBackstageSettingsEmployees(payload) {
  return request('/api/backstage/settings/employees', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function resetBackstageEmployeePassword(employeeId, payload) {
  return request(`/api/backstage/settings/employees/${employeeId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  })
}

export async function updateBackstageSettingsSecurityPolicies(payload) {
  return request('/api/backstage/settings/security-policies', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function fetchBackstageSettingsAuditLogs() {
  return request('/api/backstage/settings/audit-logs', { cache: 'no-store' })
}

export async function uploadBackstageSettingsImage({ file, category = 'profile', updatedBy = '' }) {
  return uploadBackstageImage({
    file,
    category,
    updatedBy,
  })
}
