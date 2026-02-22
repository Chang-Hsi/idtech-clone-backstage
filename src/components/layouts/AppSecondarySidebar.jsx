import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const AppSecondarySidebar = ({ config }) => {
  const location = useLocation()
  const groups = useMemo(() => config?.groups ?? [], [config])

  const autoExpanded = useMemo(() => {
    const expandedState = {}
    for (const group of groups) {
      for (const item of group.items ?? []) {
        if (!Array.isArray(item.children) || item.children.length === 0) continue
        expandedState[item.label] = item.children.some((child) =>
          location.pathname.startsWith(child.to),
        )
      }
    }
    return expandedState
  }, [groups, location.pathname])

  const [expanded, setExpanded] = useState({})

  if (!config) return null

  const toggleExpanded = (label) => {
    setExpanded((prev) => {
      const current = prev[label] ?? Boolean(autoExpanded[label])
      return { ...prev, [label]: !current }
    })
  }

  return (
    <aside className="fixed inset-y-0 left-18 hidden w-72 border-r border-slate-300 bg-slate-100 md:block">
      <div className="border-b border-slate-300 px-6 py-5">
        <h2 className="text-2xl font-semibold text-slate-800">{config.title}</h2>
      </div>

      <div className="h-[calc(100vh-88px)] space-y-6 overflow-y-auto p-5">
        {config.searchEnabled !== false ? (
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={config.searchPlaceholder}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-500"
            />
          </div>
        ) : null}

        {groups.map((group) => (
          <section key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.title}
            </h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                if (Array.isArray(item.children) && item.children.length > 0) {
                  const isExpanded = expanded[item.label] ?? Boolean(autoExpanded[item.label])
                  const isChildActive = item.children.some((child) =>
                    location.pathname.startsWith(child.to),
                  )

                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.label)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                          isChildActive
                            ? 'bg-indigo-100 font-medium text-indigo-700'
                            : 'text-slate-700 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </button>

                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-220 ease-out ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="ml-3 mt-1 space-y-1 border-l border-slate-300 pl-2">
                            {item.children.map((child) => (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                className={({ isActive }) =>
                                  `block rounded-md px-3 py-2 text-sm transition ${
                                    isActive
                                      ? 'bg-indigo-100 font-medium text-indigo-700'
                                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                                  }`
                                }
                              >
                                {child.label}
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
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
                )
              })}
            </nav>
          </section>
        ))}
      </div>
    </aside>
  )
}

export default AppSecondarySidebar
