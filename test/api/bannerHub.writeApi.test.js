import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  updateBannerHubCore,
  updateBannerHubDetail,
  updateBannerHubProductDetails,
  uploadDatasheetForProduct,
} from '../../src/api/backstageBannerHubApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageBannerHubApi write contracts', () => {
  it('update core sends PUT /core', async () => {
    await updateBannerHubCore({ items: [{ id: 'b-1' }], updatedBy: 'admin@idtech.local' })

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/banner-hub/core', {
      method: 'PUT',
      body: JSON.stringify({ items: [{ id: 'b-1' }], updatedBy: 'admin@idtech.local' }),
    })
  })

  it('update detail sends PUT /detail-pages', async () => {
    await updateBannerHubDetail({ items: [{ id: 'd-1' }], updatedBy: 'admin@idtech.local' })

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/banner-hub/detail-pages', {
      method: 'PUT',
      body: JSON.stringify({ items: [{ id: 'd-1' }], updatedBy: 'admin@idtech.local' }),
    })
  })

  it('update product details sends PUT /product-details', async () => {
    await updateBannerHubProductDetails({ items: [{ id: 'p-1' }], updatedBy: 'admin@idtech.local' })

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/banner-hub/product-details', {
      method: 'PUT',
      body: JSON.stringify({ items: [{ id: 'p-1' }], updatedBy: 'admin@idtech.local' }),
    })
  })

  it('upload datasheet sends POST with product slug path', async () => {
    await uploadDatasheetForProduct({
      productSlug: 'vp6800',
      fileName: 'spec.pdf',
      contentBase64: 'abc',
      mimeType: 'application/pdf',
      updatedBy: 'admin@idtech.local',
    })

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/banner-hub/product-details/vp6800/datasheet', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'spec.pdf',
        contentBase64: 'abc',
        mimeType: 'application/pdf',
        updatedBy: 'admin@idtech.local',
      }),
    })
  })
})
