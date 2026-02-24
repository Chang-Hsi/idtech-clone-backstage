import { Link } from 'react-router-dom'
import {
  CommandLineIcon,
  CpuChipIcon,
  ClockIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { formatDateTime } from '../../../utils/formatters'

const ACTION_ICON_STYLES = [
  { Icon: SparklesIcon, iconClass: 'text-indigo-600', bgClass: 'bg-indigo-100' },
  { Icon: MagnifyingGlassIcon, iconClass: 'text-amber-600', bgClass: 'bg-amber-100' },
  { Icon: CommandLineIcon, iconClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
  { Icon: CpuChipIcon, iconClass: 'text-cyan-600', bgClass: 'bg-cyan-100' },
  { Icon: RocketLaunchIcon, iconClass: 'text-rose-600', bgClass: 'bg-rose-100' },
]

const SUBMISSION_SOURCE_LABEL = {
  lead: 'Lead',
  contact: 'Contact',
  career: 'Career',
}

const SUBMISSION_RATIO_COLORS = {
  new: '#7c3aed',
  resolved: '#38bdf8',
  archived: '#f43f5e',
}

const ActivityRow = ({ title, createdAt, iconMeta }) => {
  const RowIcon = iconMeta.Icon
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-white px-3 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconMeta.bgClass}`}>
          <RowIcon className={`h-6 w-6 ${iconMeta.iconClass}`} />
        </span>
        <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
      </div>

      <div className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-600">
        <ClockIcon className="h-4 w-4 text-slate-400" />
        <span>{formatDateTime(createdAt)}</span>
      </div>
    </div>
  )
}

const buildPendingMessageTitle = (item) => {
  const sourceLabel = SUBMISSION_SOURCE_LABEL[String(item?.source ?? '').trim()] ?? 'Message'
  const displayName = String(item?.name ?? '').trim() || String(item?.email ?? '').trim() || 'Unknown Sender'
  return `${sourceLabel}: ${displayName}`
}

const DashboardUserPanel = ({
  userProfile,
  sessionExpiresAt,
  permissionRadarData,
  recentActions,
  hasPendingSubmissions = false,
  pendingMessageItems = [],
  submissionStatusRatio = [],
}) => {
  const hasRadarData =
    Array.isArray(permissionRadarData) &&
    permissionRadarData.length > 0 &&
    permissionRadarData.some((item) => Number.isFinite(Number(item?.value)))
  const messageRatioItems = Array.isArray(submissionStatusRatio)
    ? submissionStatusRatio.map((item) => ({
        name: String(item?.name ?? 'Unknown'),
        status: String(item?.status ?? ''),
        value: Math.max(0, Number(item?.value ?? 0) || 0),
      }))
    : []
  const messageRatioTotal = messageRatioItems.reduce((sum, item) => sum + item.value, 0)
  const messageRatioData = messageRatioItems.filter((item) => item.value > 0)
  const hasMessageRatioData = messageRatioTotal > 0

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-slate-100/90 p-5 py-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.displayName}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-200 text-2xl font-semibold text-slate-600 shadow-sm">
                {String(userProfile?.displayName ?? '?').slice(0, 1).toUpperCase()}
              </div>
            )}
            <span
              className={`absolute bottom-1 right-1 inline-block h-4 w-4 rounded-full border-2 border-slate-100 ${
                hasPendingSubmissions ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="mt-4 inline-flex max-w-full items-center gap-2">
            <p className="truncate text-xl font-semibold text-slate-900">{userProfile?.displayName ?? '-'}</p>
            <span className="inline-flex max-w-36 truncate rounded-full bg-emerald-300 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {(userProfile?.roleNames ?? []).join(', ') || 'No Role'}
            </span>
          </div>
          <p className="mt-1 max-w-full truncate text-sm text-slate-500">{userProfile?.email ?? '-'}</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="group relative">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
              <MapPinIcon className="h-8 w-8" />
            </span>
            <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
              Region: {userProfile?.regionLabel ?? '-'}
            </span>
          </div>
          <div className="group relative">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
              <UserCircleIcon className="h-8 w-8" />
            </span>
            <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
              Career: {userProfile?.careerTitle ?? '-'}
            </span>
          </div>
          <div className="group relative">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
              <ClockIcon className="h-8 w-8" />
            </span>
            <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
              Session Expires: {formatDateTime(sessionExpiresAt)}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Permission Radar</h2>
        <div className="mt-3 h-[320px] w-full rounded-lg border border-slate-200 bg-slate-50 p-2">
          {hasRadarData ? (
            <ResponsiveContainer>
              <RadarChart data={permissionRadarData} outerRadius="68%">
                <PolarGrid />
                <PolarAngleAxis dataKey="group" tick={{ fill: '#334155', fontSize: 16 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Radar name="Permission" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.24} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              Permission data unavailable.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent 5 Actions</h2>
          <Link
            to="/settings/profile"
            className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
          >
            View More Records
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {recentActions.length === 0 ? (
            <p className="text-xs text-slate-500">No activity found for current user.</p>
          ) : (
            recentActions.map((item, index) => {
              const iconMeta = ACTION_ICON_STYLES[index % ACTION_ICON_STYLES.length]

              return (
                <ActivityRow
                  key={item.id}
                  title={item.action}
                  createdAt={item.createdAt}
                  iconMeta={iconMeta}
                />
              )
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Pending Replies</h2>
          <Link
            to="/submissions/lead/new"
            className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
          >
            View More Messages
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {pendingMessageItems.length === 0 ? (
            <p className="text-xs text-slate-500">No pending messages.</p>
          ) : (
            pendingMessageItems.slice(0, 3).map((item, index) => (
              <ActivityRow
                key={`pending-${item.id}`}
                title={buildPendingMessageTitle(item)}
                createdAt={item.createdAt}
                iconMeta={ACTION_ICON_STYLES[index % ACTION_ICON_STYLES.length]}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Message Status Ratio</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="grid grid-cols-1 gap-2 rounded-lg p-3 text-xs text-slate-700">
            {messageRatioItems.map((item) => {
              const percentage = messageRatioTotal > 0 ? Math.round((item.value / messageRatioTotal) * 100) : 0
              return (
                <div key={`submission-ratio-legend-${item.status || item.name}`} className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SUBMISSION_RATIO_COLORS[item.status] ?? '#94a3b8' }}
                  />
                  <span className="truncate">
                    {item.name} - {percentage}% ({item.value})
                  </span>
                </div>
              )
            })}
          </div>

          <div className="h-[220px] w-full">
          {hasMessageRatioData ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={messageRatioData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={84}
                  innerRadius={56}
                  paddingAngle={3}
                  cornerRadius={4}
                >
                  {messageRatioData.map((item) => (
                    <Cell
                      key={`submission-ratio-${item.status}`}
                      fill={SUBMISSION_RATIO_COLORS[item.status] ?? '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, payload) => {
                    const rawValue = Number(value)
                    const percentage = messageRatioTotal > 0 ? Math.round((rawValue / messageRatioTotal) * 100) : 0
                    return [`${rawValue} (${percentage}%)`, payload?.payload?.name ?? '']
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              Message ratio unavailable.
            </div>
          )}
          </div>
        </div>
      </section>
    </aside>
  )
}

export default DashboardUserPanel
