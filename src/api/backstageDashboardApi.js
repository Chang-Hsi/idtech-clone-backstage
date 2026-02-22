import { request } from '../lib/request'

export async function fetchBackstageDashboardTestingHealth() {
  const payload = await request('/api/backstage/dashboard/testing-health', { cache: 'no-store' })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    testingHealth: data?.testingHealth ?? null,
    updatedAt: data?.updatedAt ?? null,
  }
}
