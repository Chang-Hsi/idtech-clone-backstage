import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateBackstageContactPage } from '../../src/api/backstageContactPageApi'

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

describe('backstageContactPageApi write contracts', () => {
  it('update sends only expected fields', async () => {
    const input = {
      hero: { title: 'Contact' },
      addressSection: { title: 'Address' },
      regionalCards: [],
      formContent: { title: 'Form' },
      inquiryOptions: [],
      regionOptions: [],
      updatedBy: 'admin@idtech.local',
      ignoredField: 'should-not-be-sent',
    }

    await updateBackstageContactPage(input)

    expect(mockRequest).toHaveBeenCalledWith('/api/backstage/pages/contact', {
      method: 'PUT',
      body: JSON.stringify({
        hero: input.hero,
        addressSection: input.addressSection,
        regionalCards: input.regionalCards,
        formContent: input.formContent,
        inquiryOptions: input.inquiryOptions,
        regionOptions: input.regionOptions,
        updatedBy: input.updatedBy,
      }),
    })
    expect(readBody()).not.toHaveProperty('ignoredField')
  })
})
