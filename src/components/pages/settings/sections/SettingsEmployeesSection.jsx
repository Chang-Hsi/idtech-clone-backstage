import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import DropdownSelect from '../../../common/DropdownSelect'
import FormField from '../../../common/FormField'
import Pagination from '../../../common/Pagination'

const SettingsEmployeesSection = ({
  openCreateEmployeeDialog,
  handleEmployeeSearchSubmit,
  employeeQueryInput,
  setEmployeeQueryInput,
  employeeRoleFilter,
  employeeRoleOptions,
  setEmployeeRoleFilter,
  employeeRegionFilter,
  employeeRegionFilterOptions,
  setEmployeeRegionFilter,
  employeeCareerFilter,
  employeeCareerFilterOptions,
  setEmployeeCareerFilter,
  employeeStatusFilter,
  setEmployeeStatusFilter,
  setEmployeePage,
  pagedEmployees,
  employeeOffset,
  employeeRoleMap,
  employeeRegionOptions,
  employeeCareerOptions,
  formatDateTime,
  openEditEmployeeDialog,
  requestResetEmployeePassword,
  status,
  toggleEmployeeArchive,
  employeeTotalCount,
  employeePageSize,
  employeeDialog,
  closeEmployeeDialog,
  employeeDialogErrors,
  setEmployeeDialog,
  setEmployeeDialogErrors,
  activeRoleOptions,
  statusOptions,
  saveEmployeeDialog,
}) => {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Employees</h2>
        <button
          type="button"
          onClick={openCreateEmployeeDialog}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <PlusIcon className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <form
          onSubmit={handleEmployeeSearchSubmit}
          className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_160px_160px_220px_160px_96px]"
        >
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={employeeQueryInput}
              onChange={(event) => setEmployeeQueryInput(event.target.value)}
              placeholder="Search by name, email, or employee id"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <DropdownSelect
            value={employeeRoleFilter}
            options={[{ value: 'all', label: 'All Roles' }, ...employeeRoleOptions]}
            onChange={(nextValue) => {
              setEmployeeRoleFilter(nextValue || 'all')
              setEmployeePage(1)
            }}
          />
          <DropdownSelect
            value={employeeRegionFilter}
            options={[{ value: 'all', label: 'All Regions' }, ...employeeRegionFilterOptions]}
            onChange={(nextValue) => {
              setEmployeeRegionFilter(nextValue || 'all')
              setEmployeeCareerFilter('all')
              setEmployeePage(1)
            }}
          />
          <DropdownSelect
            value={employeeCareerFilter}
            options={[{ value: 'all', label: 'All Careers' }, ...employeeCareerFilterOptions]}
            onChange={(nextValue) => {
              setEmployeeCareerFilter(nextValue || 'all')
              setEmployeePage(1)
            }}
            disabled={employeeCareerFilterOptions.length === 0}
          />
          <DropdownSelect
            value={employeeStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
            ]}
            onChange={(nextValue) => {
              setEmployeeStatusFilter(nextValue || 'all')
              setEmployeePage(1)
            }}
          />
          <button
            type="submit"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            Search
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-[1240px] table-auto border-collapse text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[64px] px-4 py-3">ID</th>
                <th className="w-[220px] px-4 py-3">Name</th>
                <th className="w-[180px] px-4 py-3">Email</th>
                <th className="w-[220px] px-4 py-3">Employee ID</th>
                <th className="w-[140px] px-4 py-3">Region</th>
                <th className="w-[220px] px-4 py-3">Career</th>
                <th className="w-[180px] px-4 py-3">Role</th>
                <th className="w-[140px] px-4 py-3">Status</th>
                <th className="w-[180px] px-4 py-3">Last Login</th>
                <th className="w-[260px] pr-8 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                pagedEmployees.map((employee, index) => {
                  const primaryRoleId = employee.roleIds?.[0] ?? ''
                  const primaryRole = employeeRoleMap.get(primaryRoleId)
                  const regionOption = employeeRegionOptions.find(
                    (option) => option.value === String(employee.regionCode ?? '').trim().toLowerCase(),
                  )
                  return (
                    <tr key={employee.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 align-middle text-slate-500">{employeeOffset + index + 1}</td>
                      <td className="px-4 py-3 align-middle">
                        <p className="font-medium text-slate-900">{employee.displayName || '-'}</p>
                        {employee.forcePasswordReset ? (
                          <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Must reset password
                          </span>
                        ) : null}
                      </td>
                      <td className="w-[220px] px-4 py-3 align-middle text-slate-600">
                        <span className="block max-w-[180px] truncate" title={employee.email || '-'}>
                          {employee.email || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600">{employee.id}</td>
                      <td className="px-4 py-3 align-middle text-slate-600">{regionOption?.label ?? '-'}</td>
                      <td className="px-4 py-3 align-middle text-slate-600">{employee.careerTitle || '-'}</td>
                      <td className="px-4 py-3 align-middle text-slate-600">{primaryRole?.name ?? '-'}</td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            employee.status === 'archived'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {employee.status === 'archived' ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600">{formatDateTime(employee.lastLoginAt)}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <div className="group relative">
                            <button
                              type="button"
                              onClick={() => openEditEmployeeDialog(employee)}
                              aria-label="Edit"
                              className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                              Edit
                            </span>
                          </div>

                          <div className="group relative">
                            <button
                              type="button"
                              onClick={() => requestResetEmployeePassword(employee)}
                              disabled={status === 'saving'}
                              aria-label="Reset Password"
                              className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
                            >
                              <KeyIcon className="h-4 w-4" />
                            </button>
                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                              Reset Password
                            </span>
                          </div>

                          <div className="group relative">
                            <button
                              type="button"
                              onClick={() => toggleEmployeeArchive(employee)}
                              aria-label={employee.status === 'archived' ? 'Restore' : 'Archive'}
                              className={`rounded-md p-1.5 transition ${
                                employee.status === 'archived'
                                  ? 'text-emerald-700 hover:bg-emerald-50'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              {employee.status === 'archived' ? (
                                <ArrowPathIcon className="h-4 w-4" />
                              ) : (
                                <ArchiveBoxIcon className="h-4 w-4" />
                              )}
                            </button>
                            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                              {employee.status === 'archived' ? 'Restore' : 'Archive'}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalCount={employeeTotalCount}
          limit={employeePageSize}
          offset={employeeOffset}
          onPageChange={(page) => setEmployeePage(page)}
        />
      </div>

      {employeeDialog.isOpen ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/55 p-4">
          <div className="fade-up-in z-[301] w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {employeeDialog.mode === 'create' ? 'Add Employee' : 'Edit Employee'}
              </h3>
              <button
                type="button"
                onClick={closeEmployeeDialog}
                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                aria-label="Close employee dialog"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="Display Name" required error={employeeDialogErrors.displayName}>
                <input
                  value={employeeDialog.displayName}
                  onChange={(event) => {
                    setEmployeeDialog((prev) => ({ ...prev, displayName: event.target.value }))
                    if (employeeDialogErrors.displayName) {
                      setEmployeeDialogErrors((prev) => ({ ...prev, displayName: '' }))
                    }
                  }}
                  placeholder="Enter display name"
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Email" required error={employeeDialogErrors.email}>
                <input
                  value={employeeDialog.email}
                  onChange={(event) => {
                    setEmployeeDialog((prev) => ({ ...prev, email: event.target.value }))
                    if (employeeDialogErrors.email) {
                      setEmployeeDialogErrors((prev) => ({ ...prev, email: '' }))
                    }
                  }}
                  placeholder="name@company.com"
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
              <FormField label="Role" required error={employeeDialogErrors.roleId}>
                <DropdownSelect
                  value={employeeDialog.roleId}
                  options={activeRoleOptions}
                  onChange={(nextValue) => {
                    setEmployeeDialog((prev) => ({ ...prev, roleId: nextValue || '' }))
                    if (employeeDialogErrors.roleId) {
                      setEmployeeDialogErrors((prev) => ({ ...prev, roleId: '' }))
                    }
                  }}
                  placeholder="Select role"
                />
              </FormField>
              <FormField label="Region" required error={employeeDialogErrors.regionCode}>
                <DropdownSelect
                  value={employeeDialog.regionCode}
                  options={employeeRegionOptions}
                  onChange={(nextValue) => {
                    const nextRegionCode = String(nextValue ?? '').trim().toLowerCase()
                    setEmployeeDialog((prev) => ({ ...prev, regionCode: nextRegionCode, careerTitle: '' }))
                    if (employeeDialogErrors.regionCode || employeeDialogErrors.careerTitle) {
                      setEmployeeDialogErrors((prev) => ({ ...prev, regionCode: '', careerTitle: '' }))
                    }
                  }}
                  placeholder="Select region"
                />
              </FormField>
              <FormField label="Career" required error={employeeDialogErrors.careerTitle}>
                <DropdownSelect
                  value={employeeDialog.careerTitle}
                  options={employeeCareerOptions}
                  onChange={(nextValue) => {
                    setEmployeeDialog((prev) => ({ ...prev, careerTitle: nextValue || '' }))
                    if (employeeDialogErrors.careerTitle) {
                      setEmployeeDialogErrors((prev) => ({ ...prev, careerTitle: '' }))
                    }
                  }}
                  placeholder={employeeDialog.regionCode ? 'Select career' : 'Select region first'}
                  disabled={!employeeDialog.regionCode}
                />
              </FormField>
              <FormField label="Status" required>
                <DropdownSelect
                  value={employeeDialog.status}
                  options={statusOptions}
                  onChange={(nextValue) =>
                    setEmployeeDialog((prev) => ({ ...prev, status: nextValue || 'active' }))
                  }
                />
              </FormField>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEmployeeDialog}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEmployeeDialog}
                disabled={status === 'saving'}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default SettingsEmployeesSection
