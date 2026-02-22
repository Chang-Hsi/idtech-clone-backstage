import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const buildRadarData = ({ role, resources, actions, hasPermission }) => {
  if (!role) return []
  const groups = Array.from(new Set(resources.map((item) => item.group)))
  const axisCount = actions.length + 1

  return groups.map((group) => {
    const groupResources = resources.filter((item) => item.group === group)
    const maxScore = groupResources.length * axisCount
    const score = groupResources.reduce((sum, resource) => {
      const actionScore = actions.reduce(
        (actionSum, action) =>
          actionSum + (hasPermission(role.permissions, resource.key, action.key) ? 1 : 0),
        0,
      )
      const fullAccessScore = hasPermission(role.permissions, resource.key, 'admin') ? 1 : 0
      return sum + actionScore + fullAccessScore
    }, 0)

    return {
      group,
      value: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      score,
      maxScore,
    }
  })
}

const RolePermissionRadarDialog = ({
  isOpen,
  onClose,
  role,
  resources,
  actions,
  hasPermission,
}) => {
  useEffect(() => {
    if (!isOpen || !role) return undefined
    const frameId = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('ui:close-popovers'))
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [isOpen, role])

  const data = useMemo(
    () =>
      buildRadarData({
        role,
        resources,
        actions,
        hasPermission,
      }),
    [actions, hasPermission, resources, role],
  )

  if (!isOpen || !role) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/55 p-4">
      <div className="fade-up-in z-[301] w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Role Permission Radar</h2>
            <p className="mt-1 text-sm text-slate-600">
              {role.name} · normalized coverage by permission group
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label="Close radar dialog"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 h-[380px] w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid />
              <PolarAngleAxis dataKey="group" tick={{ fill: '#334155', fontSize: 12 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tickCount={6}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, _key, payload) => {
                  const detail = payload?.payload
                  return [`${value}%`, `${detail?.score ?? 0}/${detail?.maxScore ?? 0}`]
                }}
              />
              <Radar
                name={role.name}
                dataKey="value"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Score is based on enabled permissions in each group: Read, Write, Archive, and Full Access.
        </p>
      </div>
    </div>,
    document.body,
  )
}

export default RolePermissionRadarDialog
