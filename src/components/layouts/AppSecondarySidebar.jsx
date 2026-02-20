import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'

const AppSecondarySidebar = ({ config }) => {
  if (!config) return null

  return (
    <aside className="ml-18 hidden min-w-72 border-r border-slate-300 bg-slate-100 md:block">
      <div className="border-b border-slate-300 px-6 py-5">
        <h2 className="text-2xl font-semibold text-slate-800">{config.title}</h2>
      </div>

      <div className="space-y-6 p-5">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={config.searchPlaceholder}
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-500"
          />
        </div>

        {config.groups.map((group) => (
          <section key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm transition ${
                      isActive
                        ? 'bg-indigo-100 font-medium text-indigo-700'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </section>
        ))}
      </div>
    </aside>
  )
}

export default AppSecondarySidebar
