import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archiveBackstageProduct,
  createBackstageProduct,
  restoreBackstageProduct,
  updateBackstageProduct,
} from '../../src/api/backstageContentProductsApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageContentProductsApi write contracts', () => {
  it('create sends POST payload', async () => {
    const payload = { slug: 'vp6800', name: 'VP6800' }
    await createBackstageProduct(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('update sends PUT payload', async () => {
    const payload = { name: 'VP6800 Updated' }
    await updateBackstageProduct('vp6800', payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/products/vp6800', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('archive sends POST with updatedBy', async () => {
    await archiveBackstageProduct('vp6800', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/products/vp6800/archive', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })

  it('restore sends POST with updatedBy', async () => {
    await restoreBackstageProduct('vp6800', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/products/vp6800/restore', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })
})
