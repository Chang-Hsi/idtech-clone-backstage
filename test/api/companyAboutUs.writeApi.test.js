import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateBackstageCompanyAboutUs } from '../../src/api/backstageCompanyAboutUsApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageCompanyAboutUsApi write contracts', () => {
  it('update sends PUT payload', async () => {
    const payload = { aboutUsPage: { intro: { title: 'About' } } }
    await updateBackstageCompanyAboutUs(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/company/about-us', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })
})
