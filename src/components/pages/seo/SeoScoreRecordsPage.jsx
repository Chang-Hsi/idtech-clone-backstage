import { useEffect, useMemo, useState } from 'react'
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
  fetchBackstageSeoScoreRecords,
  getBackstageSeoScoreRecordsEventsUrl,
  triggerBackstageSeoLighthouseWorkflow,
} from '../../../api/backstageSeoApi'
import StatusMessage from '../../common/StatusMessage'

const formatDateTime = (value) => {
  const timestamp = Date.parse(String(value ?? ''))
  if (!Number.isFinite(timestamp)) return '--'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(
    date.getHours(),
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

const formatShortDate = (value) => {
  const timestamp = Date.parse(String(value ?? ''))
  if (!Number.isFinite(timestamp)) return '--'
  const date = new Date(timestamp)
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

const toFixedValue = (value, digits = 1, suffix = '') => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'
  return `${number.toFixed(digits)}${suffix}`
}

const ScoreCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
  </div>
)

const RUN_STATUS_LABEL = {
  queued: 'Queued',
  running: 'Running',
  success: 'Success',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const RUN_STATUS_CLASS = {
  queued: 'bg-amber-100 text-amber-700',
  running: 'bg-sky-100 text-sky-700',
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-700',
}

const SeoScoreRecordsPage = () => {
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [repository, setRepository] = useState('Chang-Hsi/idtech-clone')
  const [pullRequestNumber, setPullRequestNumber] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [records, setRecords] = useState([])
  const [ciRuns, setCiRuns] = useState([])
  const [trigger, setTrigger] = useState(null)
  const [isTriggering, setIsTriggering] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const load = async ({ silent = false } = {}) => {
    if (!silent) {
      setStatus('loading')
      setErrorMessage('')
    }
    try {
      const payload = await fetchBackstageSeoScoreRecords({
        repository,
        pullRequestNumber,
        targetUrl,
        limit: 50,
        offset: 0,
      })
      setSummary(payload?.data?.summary ?? null)
      setHistory(Array.isArray(payload?.data?.history) ? payload.data.history : [])
      setRecords(Array.isArray(payload?.data?.records) ? payload.data.records : [])
      setCiRuns(Array.isArray(payload?.data?.ciRuns) ? payload.data.ciRuns : [])
      setTrigger(payload?.data?.trigger ?? null)
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error?.message || 'Unable to load score records.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const eventUrl = getBackstageSeoScoreRecordsEventsUrl({ repository })
    const source = new EventSource(eventUrl, { withCredentials: true })
    source.addEventListener('run-updated', () => {
      void load({ silent: true })
    })
    source.onerror = () => {
      // Keep latest data from regular fetch; SSE may reconnect automatically.
    }
    return () => {
      source.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository])

  const chartData = useMemo(
    () =>
      history.map((item) => ({
        ...item,
        label: formatShortDate(item.recordedAt),
      })),
    [history],
  )

  const triggerWorkflow = async () => {
    if (isTriggering) return
    setIsTriggering(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const payload = await triggerBackstageSeoLighthouseWorkflow()
      const run = payload?.data?.run
      setSuccessMessage(run?.triggerId ? `CI workflow queued (triggerId: ${run.triggerId.slice(0, 8)}...).` : 'CI workflow queued.')
      await load({ silent: true })
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to trigger Lighthouse CI workflow.')
      await load({ silent: true })
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Score Records</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lighthouse score history from CI, persisted by backend for trend tracking.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={repository}
            onChange={(event) => setRepository(event.target.value)}
            placeholder="Repository (owner/repo)"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-700"
          />
          <input
            type="text"
            value={pullRequestNumber}
            onChange={(event) => setPullRequestNumber(event.target.value.replace(/[^\d]/g, ''))}
            placeholder="PR number (optional)"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-700"
          />
          <input
            type="text"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            placeholder="Target URL (optional)"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-700"
          />
        </div>

        <button
          type="button"
          onClick={load}
          className="mt-3 inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={triggerWorkflow}
          disabled={isTriggering || Boolean(trigger?.isRunning)}
          className="ml-2 mt-3 inline-flex h-9 items-center rounded-md border border-red-300 bg-red-500 px-3 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isTriggering ? 'Triggering...' : trigger?.isRunning ? 'CI Running...' : 'Run CI Workflow'}
        </button>
      </div>

      {errorMessage ? (
        <StatusMessage tone="error" message={errorMessage} />
      ) : null}
      {successMessage ? <StatusMessage tone="success" message={successMessage} /> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <ScoreCard label="Performance" value={toFixedValue(summary?.performanceScore, 1)} />
        <ScoreCard label="LCP" value={toFixedValue(summary?.lcpMs, 0, ' ms')} />
        <ScoreCard label="CLS" value={toFixedValue(summary?.cls, 3)} />
        <ScoreCard label="FID-like" value={toFixedValue(summary?.fidLikeMs, 0, ' ms')} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Trend</h2>
        <div className="mt-3 h-[280px] w-full">
          {status === 'loading' ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart...</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No score history.</div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8dee8" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="score" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="metric" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip labelFormatter={(_, payload) => formatDateTime(payload?.[0]?.payload?.recordedAt)} />
                <Legend />
                <Line yAxisId="score" type="monotone" dataKey="performanceScore" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} name="Performance" />
                <Line yAxisId="metric" type="monotone" dataKey="lcpMs" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} name="LCP (ms)" />
                <Line yAxisId="metric" type="monotone" dataKey="cls" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="CLS" />
                <Line yAxisId="metric" type="monotone" dataKey="fidLikeMs" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} name="FID-like (ms)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Records</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[880px] table-fixed text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Repo</th>
                <th className="px-3 py-2">PR</th>
                <th className="px-3 py-2">Perf</th>
                <th className="px-3 py-2">LCP</th>
                <th className="px-3 py-2">CLS</th>
                <th className="px-3 py-2">FID-like</th>
                <th className="px-3 py-2">Run</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-5 text-center text-sm text-slate-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{formatDateTime(record.recordedAt)}</td>
                    <td className="truncate px-3 py-2">{record.repository}</td>
                    <td className="px-3 py-2">{record.pullRequestNumber ?? '-'}</td>
                    <td className="px-3 py-2">{toFixedValue(record.performanceScore, 1)}</td>
                    <td className="px-3 py-2">{toFixedValue(record.lcpMs, 0, ' ms')}</td>
                    <td className="px-3 py-2">{toFixedValue(record.cls, 3)}</td>
                    <td className="px-3 py-2">{toFixedValue(record.fidLikeMs, 0, ' ms')}</td>
                    <td className="px-3 py-2">
                      {record.runUrl ? (
                        <a
                          href={record.runUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Open
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">CI Runs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Workflow</th>
                <th className="px-3 py-2">Run</th>
                <th className="px-3 py-2">Failure Step</th>
                <th className="px-3 py-2">Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {ciRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-5 text-center text-sm text-slate-500">
                    No CI run records.
                  </td>
                </tr>
              ) : (
                ciRuns.map((run) => (
                  <tr key={run.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{formatDateTime(run.requestedAt)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          RUN_STATUS_CLASS[run.status] ?? 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {RUN_STATUS_LABEL[run.status] ?? run.status ?? '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{run.workflowId || '-'}</td>
                    <td className="px-3 py-2">
                      {run.runUrl ? (
                        <a href={run.runUrl} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:text-indigo-500">
                          Open
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="truncate px-3 py-2 text-red-700">{run.failureStep || '-'}</td>
                    <td className="truncate px-3 py-2 text-red-700">{run.failureReason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default SeoScoreRecordsPage
