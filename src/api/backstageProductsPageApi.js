import { request } from '../lib/request'

export async function fetchBackstageProductsPage() {
  const payload = await request('/api/backstage/pages/products', { cache: 'no-store' })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    productsPage: data?.productsPage ?? null,
    updatedAt: data?.updatedAt ?? null,
  }
}

export async function updateBackstageProductsPage({ hero, leadForm, updatedBy }) {
  const payload = await request('/api/backstage/pages/products', {
    method: 'PUT',
    body: JSON.stringify({ hero, leadForm, updatedBy }),
  })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    productsPage: data?.productsPage ?? null,
    updatedAt: data?.updatedAt ?? null,
  }
}
