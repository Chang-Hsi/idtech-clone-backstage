import { Link } from 'react-router-dom'
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
import { formatDateTime } from '../../../utils/formatters'

const toShortDate = (value) => {
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

const MetricCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
  </div>
)

const DashboardLighthouseSnapshotPanel = ({ snapshot }) => {
  const summary = snapshot?.summary ?? null
  const to = snapshot?.to || '/seo/score-records'
  const history = Array.isArray(snapshot?.history) ? snapshot.history : []
  const chartData = history.map((item) => ({
    ...item,
    label: toShortDate(item.recordedAt),
  }))
  const hasData = Boolean(summary) || chartData.length > 0

  return (
    <Link to={to} className="block">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Lighthouse Snapshot</h2>
          <span className="text-xs text-slate-500">View Score Records</span>
        </div>

        {!hasData ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No lighthouse records yet.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Performance" value={toFixedValue(summary?.performanceScore, 1)} />
              <MetricCard label="LCP" value={toFixedValue(summary?.lcpMs, 0, ' ms')} />
              <MetricCard label="CLS" value={toFixedValue(summary?.cls, 3)} />
              <MetricCard label="FID-like" value={toFixedValue(summary?.fidLikeMs, 0, ' ms')} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              {chartData.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">No trend data.</div>
              ) : (
                <div className="h-[260px] w-full">
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
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </Link>
  )
}

export default DashboardLighthouseSnapshotPanel
