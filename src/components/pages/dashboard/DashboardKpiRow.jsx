import { Link } from 'react-router-dom'

const DashboardKpiRow = ({ items }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.title}
          to={item.to}
          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
          <p className="mt-2 text-xs text-slate-500 group-hover:text-slate-700">{item.description}</p>
        </Link>
      ))}
    </div>
  )
}

export default DashboardKpiRow
