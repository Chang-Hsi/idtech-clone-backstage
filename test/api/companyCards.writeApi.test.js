import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  archiveBackstageCompanyCard,
  createBackstageCompanyCard,
  reorderBackstageCompanyCards,
  restoreBackstageCompanyCard,
  updateBackstageCompanyCard,
} from '../../src/api/backstageCompanyCardsApi'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('../../src/lib/request', () => ({ request: mockRequest }))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue({})
})

describe('backstageCompanyCardsApi write contracts', () => {
  it('create sends POST payload', async () => {
    const payload = { id: 'card-1', title: 'Card' }
    await createBackstageCompanyCard(payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/company/cards', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('update sends PUT with id path', async () => {
    const payload = { title: 'Updated' }
    await updateBackstageCompanyCard('card-1', payload)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/company/cards/card-1', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('archive sends POST with updatedBy', async () => {
    await archiveBackstageCompanyCard('card-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/company/cards/card-1/archive', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })

  it('restore sends POST with updatedBy', async () => {
    await restoreBackstageCompanyCard('card-1', 'admin@idtech.local')

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/company/cards/card-1/restore', {
      method: 'POST',
      body: JSON.stringify({ updatedBy: 'admin@idtech.local' }),
    })
  })

  it('reorder sends POST payload', async () => {
    await reorderBackstageCompanyCards({
      status: 'active',
      orderedIds: ['card-1', 'card-2'],
      updatedBy: 'admin@idtech.local',
    })

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/content/company/cards/reorder', {
      method: 'POST',
      body: JSON.stringify({
        status: 'active',
        orderedIds: ['card-1', 'card-2'],
        updatedBy: 'admin@idtech.local',
      }),
    })
  })
})
