import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateBackstageProductsPage } from '../../src/api/backstageProductsPageApi'

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

describe('backstageProductsPageApi write contracts', () => {
  it('update sends only hero/leadForm/updatedBy', async () => {
    await updateBackstageProductsPage({
      hero: { title: 'Products' },
      leadForm: { title: 'Lead' },
      updatedBy: 'admin@idtech.local',
      ignoredField: 'ignore-me',
    })

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/pages/products', {
      method: 'PUT',
      body: JSON.stringify({
        hero: { title: 'Products' },
        leadForm: { title: 'Lead' },
        updatedBy: 'admin@idtech.local',
      }),
    })
    expect(readBody()).not.toHaveProperty('ignoredField')
  })
})
