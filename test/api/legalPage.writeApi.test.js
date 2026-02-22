import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateBackstagePrivacyPolicyPage } from '../../src/api/backstageLegalApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageLegalApi write contracts', () => {
  it('privacy policy update sends PUT payload', async () => {
    const payload = { title: 'Privacy', markdown: '## policy' }
    await updateBackstagePrivacyPolicyPage(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/pages/legal/privacy-policy', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })
})
