import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archiveBackstageCollection,
  createBackstageCollection,
  restoreBackstageCollection,
  updateBackstageCollection,
} from '../../src/api/backstageContentCollectionsApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageContentCollectionsApi write contracts', () => {
  it('create sends POST payload', async () => {
    const payload = { slug: 'collection-1', title: 'Collection' }
    await createBackstageCollection(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('update sends PUT payload', async () => {
    const payload = { title: 'Collection Updated' }
    await updateBackstageCollection('collection-1', payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/collections/collection-1', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('archive sends POST with updatedBy', async () => {
    await archiveBackstageCollection('collection-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/collections/collection-1/archive', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })

  it('restore sends POST with updatedBy', async () => {
    await restoreBackstageCollection('collection-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/collections/collection-1/restore', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })
})
