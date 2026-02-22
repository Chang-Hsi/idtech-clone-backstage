import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archiveBackstageUseCase,
  createBackstageUseCase,
  restoreBackstageUseCase,
  updateBackstageUseCase,
} from '../../src/api/backstageContentUseCasesApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageContentUseCasesApi write contracts', () => {
  it('create sends POST payload', async () => {
    const payload = { slug: 'use-case-1', title: 'Use Case' }
    await createBackstageUseCase(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/use-cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('update sends PUT payload', async () => {
    const payload = { title: 'Updated Use Case' }
    await updateBackstageUseCase('use-case-1', payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/use-cases/use-case-1', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('archive sends POST with updatedBy', async () => {
    await archiveBackstageUseCase('use-case-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/use-cases/use-case-1/archive', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })

  it('restore sends POST with updatedBy', async () => {
    await restoreBackstageUseCase('use-case-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/use-cases/use-case-1/restore', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })
})
