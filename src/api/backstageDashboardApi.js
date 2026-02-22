import { request } from '../lib/request'

export async function fetchBackstageDashboardSummary() {
  const payload = await request('/api/backstage/dashboard/summary', { cache: 'no-store' })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    summary: data?.summary ?? null,
  }
}

export async function fetchBackstageDashboardTestingHealth() {
  const payload = await request('/api/backstage/dashboard/testing-health', { cache: 'no-store' })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    testingHealth: data?.testingHealth ?? null,
    trigger: data?.trigger ?? null,
    updatedAt: data?.updatedAt ?? null,
  }
}

export async function triggerBackstageDashboardTestingHealthRefresh() {
  const payload = await request('/api/backstage/dashboard/testing-health/trigger', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  const data = payload?.data ?? {}

  return {
    code: typeof payload?.code === 'number' ? payload.code : -1,
    message: payload?.message ?? '',
    trigger: data?.trigger ?? null,
    updatedAt: data?.updatedAt ?? null,
  }
}
