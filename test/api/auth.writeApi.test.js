import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginBackstage, logoutBackstage } from '../../src/api/backstageAuthApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageAuthApi write contracts', () => {
  it('login sends POST with payload', async () => {
    const payload = { email: 'admin@idtech.local', password: 'pw' }
    await loginBackstage(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('logout sends POST without body', async () => {
    await logoutBackstage()

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/auth/logout', {
      method: 'POST',
    })
  })
})
