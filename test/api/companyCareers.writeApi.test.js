import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateBackstageCompanyCareers } from '../../src/api/backstageCompanyCareersApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageCompanyCareersApi write contracts', () => {
  it('update sends PUT payload', async () => {
    const payload = { tabs: [], jobs: [], updatedBy: 'admin@idtech.local' }
    await updateBackstageCompanyCareers(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/company/careers', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })
})
