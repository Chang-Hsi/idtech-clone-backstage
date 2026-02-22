import { PlusIcon, PresentationChartLineIcon, TrashIcon } from '@heroicons/react/24/outline'
import DropdownSelect from '../../../common/DropdownSelect'

const SettingsRolesSection = ({
  settings,
  selectedRole,
  selectedRoleId,
  setSelectedRoleId,
  setRoleRadarDialog,
  setSettings,
  saveRoles,
  status,
  updateSelectedRole,
  removeSelectedRole,
  statusOptions,
  settingsActions,
  settingsResources,
  hasPermission,
  togglePermission,
  getRoleTagClass,
}) => {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Roles & Permissions</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextRole = {
                id: `role-${Date.now()}`,
                name: 'New Role',
                description: '',
                status: 'active',
                permissions: ['pages:read'],
              }
              setSettings((prev) => ({ ...prev, roles: [...prev.roles, nextRole] }))
              setSelectedRoleId(nextRole.id)
            }}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <PlusIcon className="h-4 w-4" />
            Add Role
          </button>
          <button
            type="button"
            onClick={saveRoles}
            disabled={status === 'saving'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            Save Roles
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {settings.roles.length === 0 ? (
            <p className="text-sm text-slate-500">No roles yet. Create one to start permission setup.</p>
          ) : null}
          {settings.roles.map((role) => (
            <div key={role.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full rounded-md border px-3 py-2 pr-10 text-left text-sm ${
                  selectedRole?.id === role.id
                    ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <p className="font-medium">{role.name}</p>
                <p className="mt-1 text-xs text-slate-500">{role.description || 'No description'}</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getRoleTagClass(role)}`}>
                  {role.status}
                </span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setRoleRadarDialog({ isOpen: true, roleId: role.id })
                }}
                className="absolute right-2 top-2 rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                aria-label={`Open ${role.name} radar chart`}
              >
                <PresentationChartLineIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </aside>

        {selectedRole ? (
          <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                enforced
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_180px_40px]">
              <div className="space-y-2">
                <input
                  value={selectedRole.name}
                  onChange={(event) => updateSelectedRole((role) => ({ ...role, name: event.target.value }))}
                  placeholder="Role name"
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                />
                <textarea
                  value={selectedRole.description}
                  onChange={(event) => updateSelectedRole((role) => ({ ...role, description: event.target.value }))}
                  rows={2}
                  placeholder="Role description"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <DropdownSelect
                value={selectedRole.status}
                options={statusOptions}
                onChange={(nextValue) => updateSelectedRole((role) => ({ ...role, status: nextValue || 'active' }))}
              />

              <button
                type="button"
                onClick={removeSelectedRole}
                className="mb-auto pt-2 text-slate-500 hover:bg-slate-50"
                aria-label="remove role"
              >
                <TrashIcon className="mx-auto h-4 w-4" />
              </button>
            </div>

            <div className="overflow-auto rounded-md border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="w-[260px] px-3 py-2 text-left">Resource</th>
                    <th className="w-[120px] px-3 py-2 text-left">Group</th>
                    {settingsActions.map((action) => (
                      <th key={action.key} className="px-3 py-2 text-center uppercase">
                        {action.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center">Full Access</th>
                  </tr>
                </thead>
                <tbody>
                  {settingsResources.map((resource) => {
                    const fullAccessChecked = hasPermission(selectedRole.permissions, resource.key, 'admin')

                    return (
                      <tr key={resource.key} className="border-t border-slate-200">
                        <td className="px-3 py-2 font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <span>{resource.label}</span>
                            <span
                              className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                resource.state === 'enforced'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {resource.state}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{resource.group}</td>
                        {settingsActions.map((action) => {
                          const checked = hasPermission(selectedRole.permissions, resource.key, action.key)
                          return (
                            <td key={`${resource.key}:${action.key}`} className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={fullAccessChecked}
                                onChange={(event) =>
                                  updateSelectedRole((role) => ({
                                    ...role,
                                    permissions: togglePermission(
                                      role.permissions,
                                      resource.key,
                                      action.key,
                                      event.target.checked,
                                    ),
                                  }))
                                }
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 disabled"
                              />
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={fullAccessChecked}
                            onChange={(event) =>
                              updateSelectedRole((role) => ({
                                ...role,
                                permissions: togglePermission(
                                  role.permissions,
                                  resource.key,
                                  'admin',
                                  event.target.checked,
                                ),
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            Select a role from the left panel.
          </div>
        )}
      </div>
    </section>
  )
}

export default SettingsRolesSection
