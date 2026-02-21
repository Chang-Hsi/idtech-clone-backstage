import { request } from '../lib/request'

export async function fetchBackstageContactPage() {
  const payload = await request('/api/backstage/pages/contact', { cache: 'no-store' })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    contactPage: data?.contactPage ?? null,
    updatedAt: data?.updatedAt ?? null,
    updatedBy: data?.updatedBy ?? null,
  }
}

export async function updateBackstageContactPage(input) {
  const {
    hero,
    addressSection,
    regionalCards,
    formContent,
    inquiryOptions,
    regionOptions,
    updatedBy,
  } = input

  const payload = await request('/api/backstage/pages/contact', {
    method: 'PUT',
    body: JSON.stringify({
      hero,
      addressSection,
      regionalCards,
      formContent,
      inquiryOptions,
      regionOptions,
      updatedBy,
    }),
  })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    contactPage: data?.contactPage ?? null,
    updatedAt: data?.updatedAt ?? null,
    updatedBy: data?.updatedBy ?? null,
  }
}
