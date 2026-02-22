import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'

const COLOR_ACTIVE = '#6366f1'
const COLOR_ARCHIVED = '#f97316'
const CATEGORY_COLORS = [
  '#7c3aed',
  '#4f46e5',
  '#a855f7',
  '#38bdf8',
  '#34d399',
  '#f43f5e',
  '#f59e0b',
  '#14b8a6',
]

const DashboardContentChartsPanel = ({ mixData }) => {
  const navigate = useNavigate()

  const categoryData = useMemo(() => {
    const list = Array.isArray(mixData) ? mixData : []
    return list
      .map((item) => ({
        name: item.name,
        value: Number(item.active ?? 0) + Number(item.archived ?? 0) || Number(item.value ?? 0),
      }))
      .filter((item) => item.value > 0)
  }, [mixData])

  const totalCategoryCount = useMemo(
    () => categoryData.reduce((sum, item) => sum + item.value, 0),
    [categoryData],
  )

  const handleModuleClick = (payload) => {
    const route = payload?.to
    if (!route) return
    navigate(route)
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Content Active vs Archived</h2>
        <p className="mt-1 text-xs text-slate-500">Click a module bar group to open its management page.</p>
        <div className="mt-3 h-[260px] w-full">
          <ResponsiveContainer>
            <BarChart data={mixData} margin={{ top: 8, right: 8, bottom: 24, left: 0 }} barGap={8}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-20} textAnchor="end" height={56} interval={0} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                formatter={(value, name) => [value, name === 'active' ? 'Active' : 'Archived']}
              />
              <Legend
                formatter={(value) => (value === 'active' ? 'Active' : 'Archived')}
                wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
              />
              <Bar
                dataKey="active"
                fill={COLOR_ACTIVE}
                radius={[6, 6, 0, 0]}
                onClick={(value) => handleModuleClick(value?.payload)}
                cursor="pointer"
              />
              <Bar
                dataKey="archived"
                fill={COLOR_ARCHIVED}
                radius={[6, 6, 0, 0]}
                onClick={(value) => handleModuleClick(value?.payload)}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Content Category Ratio</h2>
        <p className="mt-1 text-xs text-slate-500">Module share by total entities (active + archived).</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2  p-3 text-xs text-slate-700">
            {categoryData.map((entry, index) => {
              const percentage = totalCategoryCount > 0 ? Math.round((entry.value / totalCategoryCount) * 100) : 0
              return (
                <div key={entry.name} className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                  />
                  <span className="truncate">{entry.name} - {percentage}%</span>
                </div>
              )
            })}
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={88}
                  innerRadius={58}
                  paddingAngle={3}
                  cornerRadius={4}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${entry.value}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, payload) => {
                    const percent = totalCategoryCount > 0 ? Math.round((Number(value) / totalCategoryCount) * 100) : 0
                    return [`${value} (${percent}%)`, payload?.payload?.name ?? '']
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardContentChartsPanel
