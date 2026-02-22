import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchBackstageDashboardTestingHealth,
  triggerBackstageDashboardTestingHealthRefresh,
} from '../api/backstageDashboardApi'
import StatusMessage from '../components/common/StatusMessage'
import { formatDateTime } from '../utils/formatters'

const TREND_META = {
  up: { label: 'Up', className: 'text-emerald-600', icon: '↑' },
  down: { label: 'Down', className: 'text-rose-600', icon: '↓' },
  flat: { label: 'Flat', className: 'text-slate-500', icon: '→' },
}

const toPercent = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0.0%'
  return `${number.toFixed(1)}%`
}

const toShortTime = (value) => {
  const timestamp = Date.parse(String(value ?? ''))
  if (!Number.isFinite(timestamp)) return '--'
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

const TestingKpiCard = ({ title, value, trend }) => {
  const trendMeta = TREND_META[trend] ?? TREND_META.flat
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className={`mt-2 text-xs font-medium ${trendMeta.className}`}>
        {trendMeta.icon} {trendMeta.label}
      </p>
    </div>
  )
}

const DashboardPageManager = () => {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [testingHealth, setTestingHealth] = useState(null)
  const [triggerInfo, setTriggerInfo] = useState(null)
  const [isTriggering, setIsTriggering] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  const loadDashboard = useCallback(async ({ preserveStatus = false } = {}) => {
    if (!preserveStatus) setStatus('loading')
    setErrorMessage('')
    try {
      const response = await fetchBackstageDashboardTestingHealth()
      if (response.code !== 0) throw new Error(response.message || 'Failed to load dashboard data.')
      setTestingHealth(response.testingHealth ?? null)
      setTriggerInfo(response.trigger ?? null)
      setUpdatedAt(response.updatedAt ?? null)
      setStatus('success')
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to load dashboard data.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const remaining = Number(triggerInfo?.cooldownRemainingSeconds ?? 0)
    if (remaining <= 0) return undefined
    const timer = window.setInterval(() => {
      setTriggerInfo((prev) => {
        const value = Number(prev?.cooldownRemainingSeconds ?? 0)
        if (value <= 1) return { ...(prev ?? {}), cooldownRemainingSeconds: 0 }
        return { ...(prev ?? {}), cooldownRemainingSeconds: value - 1 }
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [triggerInfo?.cooldownRemainingSeconds])

  const handleTriggerRefresh = async () => {
    if (isTriggering) return
    if (Number(triggerInfo?.cooldownRemainingSeconds ?? 0) > 0) return
    setIsTriggering(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const response = await triggerBackstageDashboardTestingHealthRefresh()
      if (response.code !== 0) throw new Error(response.message || 'Unable to trigger testing refresh.')
      setTriggerInfo(response.trigger ?? null)
      setSuccessMessage('Testing health refresh queued. Coverage will update after CI completes.')
      await loadDashboard({ preserveStatus: true })
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to trigger testing refresh.')
    } finally {
      setIsTriggering(false)
    }
  }

  const summary = testingHealth?.summary ?? null
  const history = useMemo(() => {
    const raw = Array.isArray(testingHealth?.history) ? testingHealth.history : []
    return raw.map((item) => ({
      ...item,
      label: toShortTime(item.recordedAt),
    }))
  }, [testingHealth?.history])

  const cooldownRemainingSeconds = Number(triggerInfo?.cooldownRemainingSeconds ?? 0)
  const isCooldownActive = cooldownRemainingSeconds > 0
  const triggerButtonLabel = isTriggering
    ? 'Triggering...'
    : isCooldownActive
      ? `Retry in ${cooldownRemainingSeconds}s`
      : 'Run CI refresh'

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Testing health overview powered by CI coverage snapshots.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleTriggerRefresh}
              disabled={isTriggering || isCooldownActive}
              title="Trigger backend/backstage coverage workflows and refresh Dashboard data."
              className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-slate-700 transition ${
                isTriggering || isCooldownActive
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
              aria-label={triggerButtonLabel}
            >
              <ArrowPathIcon className={`h-4 w-4 ${isTriggering ? 'animate-spin' : ''}`} />
              <span className="pointer-events-none absolute -top-11 left-1/2 w-60 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                {triggerButtonLabel}
              </span>
            </button>
            <div className="text-right text-xs text-slate-500">
              <p>Last refresh</p>
              <p className="mt-1 font-medium text-slate-700">{formatDateTime(updatedAt)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Last trigger: {formatDateTime(triggerInfo?.lastTriggeredAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <StatusMessage tone="error" message={errorMessage} />
      <StatusMessage tone="success" message={successMessage} />

      {status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading dashboard metrics...
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <TestingKpiCard
            title="Backend Coverage"
            value={toPercent(summary.backendCoverage)}
            trend={summary?.trend?.backendCoverage}
          />
          <TestingKpiCard
            title="Backstage Coverage"
            value={toPercent(summary.backstageCoverage)}
            trend={summary?.trend?.backstageCoverage}
          />
          <TestingKpiCard
            title="Latest Test Pass Rate"
            value={toPercent(summary.passRate)}
            trend={summary?.trend?.passRate}
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Testing Trend (Recharts)</h2>
          <p className="text-xs text-slate-500">Recent CI snapshots</p>
        </div>
        {history.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No CI metrics ingested yet. Push metrics from CI to start trend tracking.
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                  labelFormatter={(_, payload) => formatDateTime(payload?.[0]?.payload?.recordedAt)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="backendCoverage"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Backend Coverage"
                />
                <Line
                  type="monotone"
                  dataKey="backstageCoverage"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Backstage Coverage"
                />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Pass Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  )
}

export default DashboardPageManager
