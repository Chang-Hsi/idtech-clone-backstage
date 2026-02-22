import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetBackstageSeoTargetFallback, updateBackstageSeoTarget } from '../../src/api/backstageSeoApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageSeoApi write contracts', () => {
  it('update target encodes key and sends PUT payload', async () => {
    const payload = { title: 'About Us' }
    await updateBackstageSeoTarget('page:about us', payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/seo/targets/page%3Aabout%20us', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('reset fallback encodes key and sends default empty payload', async () => {
    await resetBackstageSeoTargetFallback('page:about us')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/seo/targets/page%3Aabout%20us/reset-fallback', {
      method: 'PUT',
      body: JSON.stringify({}),
    })
  })
})
