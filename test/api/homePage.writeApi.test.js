import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateBackstageHomePage } from '../../src/api/backstageHomeApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

const readBody = () => {
  const [, options] = mockRequest.mock.calls[0]
  if (!options?.body) return undefined
  return JSON.parse(options.body)
}

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageHomeApi write contracts', () => {
  it('update sends only heroSlides/updatedBy', async () => {
    await updateBackstageHomePage({
      heroSlides: [{ id: 'hero-1' }],
      updatedBy: 'admin@idtech.local',
      ignoredField: 'ignore-me',
    })

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/pages/home', {
      method: 'PUT',
      body: JSON.stringify({
        heroSlides: [{ id: 'hero-1' }],
        updatedBy: 'admin@idtech.local',
      }),
    })
    expect(readBody()).not.toHaveProperty('ignoredField')
  })
})
