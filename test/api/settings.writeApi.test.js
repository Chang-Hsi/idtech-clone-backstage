import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resetBackstageEmployeePassword,
  updateBackstageSettingsEmployees,
  updateBackstageSettingsPassword,
  updateBackstageSettingsProfile,
  updateBackstageSettingsRoles,
  updateBackstageSettingsSecurityPolicies,
} from '../../src/api/backstageSettingsApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageSettingsApi write contracts', () => {
  it('profile update sends PUT payload', async () => {
    const payload = { profile: { displayName: 'Admin' } }
    await updateBackstageSettingsProfile(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('password update sends PUT payload', async () => {
    const payload = { currentPassword: 'old', nextPassword: 'new' }
    await updateBackstageSettingsPassword(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/settings/profile/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('roles update sends PUT payload', async () => {
    const payload = { roles: [{ id: 'role-editor' }], updatedBy: 'admin@idtech.local' }
    await updateBackstageSettingsRoles(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/settings/roles', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('employees update sends PUT payload', async () => {
    const payload = { employees: [{ id: 'emp-1' }], updatedBy: 'admin@idtech.local' }
    await updateBackstageSettingsEmployees(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/settings/employees', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('reset employee password sends POST with empty object by default', async () => {
    await resetBackstageEmployeePassword('emp-1')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/settings/employees/emp-1/reset-password', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  })

  it('reset employee password sends POST with payload when provided', async () => {
    const payload = { updatedBy: 'admin@idtech.local' }
    await resetBackstageEmployeePassword('emp-1', payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/settings/employees/emp-1/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('security policies update sends PUT payload', async () => {
    const payload = { passwordPolicy: { minLength: 10 }, updatedBy: 'admin@idtech.local' }
    await updateBackstageSettingsSecurityPolicies(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/settings/security-policies', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })
})
