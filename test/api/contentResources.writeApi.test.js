import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archiveBackstageResource,
  createBackstageResource,
  restoreBackstageResource,
  updateBackstageResource,
} from '../../src/api/backstageContentResourcesApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageContentResourcesApi write contracts', () => {
  it('create sends POST payload', async () => {
    const payload = { slug: 'resource-1', title: 'Resource' }
    await createBackstageResource(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('update sends PUT payload', async () => {
    const payload = { title: 'Updated Resource' }
    await updateBackstageResource('resource-1', payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/resources/resource-1', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('archive sends POST with updatedBy', async () => {
    await archiveBackstageResource('resource-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/resources/resource-1/archive', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })

  it('restore sends POST with updatedBy', async () => {
    await restoreBackstageResource('resource-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/resources/resource-1/restore', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })
})
