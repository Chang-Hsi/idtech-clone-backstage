import {
  ArrowLongRightIcon,
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
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

const TREND_META = {
  up: { label: 'Up', className: 'text-emerald-600', Icon: ArrowTrendingDownIcon },
  down: { label: 'Down', className: 'text-rose-600', Icon: ArrowTrendingUpIcon },
  flat: { label: 'Flat', className: 'text-slate-500', Icon: ArrowLongRightIcon },
}

const toPercent = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0.0%'
  return `${number.toFixed(1)}%`
}

const toDeltaPercent = (history, key) => {
  const list = Array.isArray(history) ? history : []
  if (list.length < 2) return '--'
  const current = Number(list[list.length - 1]?.[key] ?? NaN)
  const previous = Number(list[list.length - 2]?.[key] ?? NaN)
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return '--'
  if (Math.abs(previous) < Number.EPSILON) return current === 0 ? '0.0%' : '--'
  const delta = ((current - previous) / Math.abs(previous)) * 100
  return `${Math.abs(delta).toFixed(1)}%`
}

const TestingKpiCard = ({ title, value, trend, deltaPercent }) => {
  const trendMeta = TREND_META[trend] ?? TREND_META.flat
  const TrendIcon = trendMeta.Icon
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-2 flex items-end gap-10">
        <p className="text-4xl font-semibold leading-none text-slate-900">{value}</p>
        <div className={`inline-flex items-center gap-1.5 pb-1 text-xl font-semibold ${trendMeta.className}`}>
          <TrendIcon className="h-8 w-8" />
          <span>{deltaPercent}</span>
        </div>
      </div>
    </div>
  )
}

const DashboardTestingHealthPanel = ({
  summary,
  history,
  triggerInfo,
  isTriggering,
  onTrigger,
}) => {
  const cooldownRemainingSeconds = Number(triggerInfo?.cooldownRemainingSeconds ?? 0)
  const isCooldownActive = cooldownRemainingSeconds > 0
  const triggerButtonLabel = isTriggering
    ? 'Triggering...'
    : isCooldownActive
      ? `Retry in ${cooldownRemainingSeconds}s`
      : 'Run CI refresh'

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Testing Health</h2>
          <p className="mt-1 text-xs text-slate-500">Vitest coverage and pass-rate trend from CI snapshots.</p>
        </div>

        <button
          type="button"
          onClick={onTrigger}
          disabled={isTriggering || isCooldownActive}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition ${
            isTriggering || isCooldownActive
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ArrowPathIcon className={`h-4 w-4 ${isTriggering ? 'animate-spin' : ''}`} />
          {triggerButtonLabel}
        </button>
      </div>

      {summary ? (
        <div className="grid gap-3 md:grid-cols-3">
          <TestingKpiCard
            title="Backend Coverage"
            value={toPercent(summary.backendCoverage)}
            trend={summary?.trend?.backendCoverage}
            deltaPercent={toDeltaPercent(history, 'backendCoverage')}
          />
          <TestingKpiCard
            title="Backstage Coverage"
            value={toPercent(summary.backstageCoverage)}
            trend={summary?.trend?.backstageCoverage}
            deltaPercent={toDeltaPercent(history, 'backstageCoverage')}
          />
          <TestingKpiCard
            title="Pass Rate"
            value={toPercent(summary.passRate)}
            trend={summary?.trend?.passRate}
            deltaPercent={toDeltaPercent(history, 'passRate')}
          />
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        {history.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No CI metrics ingested yet.
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8dee8" />
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
                <Line type="monotone" dataKey="backendCoverage" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} name="Backend" />
                <Line type="monotone" dataKey="backstageCoverage" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} name="Backstage" />
                <Line type="monotone" dataKey="passRate" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} name="Pass Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[11px] text-slate-500">
        <span>Last recorded: {formatDateTime(summary?.lastRecordedAt)}</span>
        <span>Last trigger: {formatDateTime(triggerInfo?.lastTriggeredAt)}</span>
      </div>
    </section>
  )
}

export default DashboardTestingHealthPanel
