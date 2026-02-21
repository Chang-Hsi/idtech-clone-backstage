import { useEffect, useMemo, useState } from 'react'
import { ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthProvider'
import ConfirmDialog from '../../dialog/ConfirmDialog'
import RemindDialog from '../../dialog/RemindDialog'
import FormField from '../../common/FormField'
import StatusMessage from '../../common/StatusMessage'
import {
  fetchBackstageCompanyCareers,
  updateBackstageCompanyCareers,
} from '../../../api/backstageCompanyCareersApi'
import {
  STATUS_ACTIVE,
  STATUS_ARCHIVED,
  buildCareersUpdatePayload,
  normalizeCareersPayload,
  slugify,
} from './careers/careersFormUtils'

const buildUniqueTabKey = (label, tabs, targetKey = '') => {
  let base = slugify(label) || 'tab'
  if (base === 'all') base = 'tab'

  const used = new Set(
    tabs
      .map((tab) => String(tab?.key ?? '').trim().toLowerCase())
      .filter((key) => key && key !== targetKey),
  )

  let candidate = base
  let suffix = 2
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}

const CareersPageEditor = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [form, setForm] = useState(() => normalizeCareersPayload(null))
  const [isTabsExpanded, setIsTabsExpanded] = useState(false)
  const [jobsTab, setJobsTab] = useState(STATUS_ACTIVE)
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')

  const [tabDialog, setTabDialog] = useState({ isOpen: false, mode: 'create', label: '', targetKey: '' })
  const [tabDialogErrors, setTabDialogErrors] = useState({ label: '', key: '' })
  const [deleteTabTarget, setDeleteTabTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [remindDialog, setRemindDialog] = useState({ isOpen: false, title: '', description: '' })

  useEffect(() => {
    const load = async () => {
      setErrorMessage('')
      try {
        const payload = await fetchBackstageCompanyCareers()
        const page = payload?.data?.careersPage
        setForm(normalizeCareersPayload(page))
        setUpdatedAt(page?.updatedAt ?? '')
        setStatus('success')
      } catch (error) {
        setStatus('error')
        setErrorMessage(error?.message || 'Unable to load careers content.')
      }
    }

    load()
  }, [])

  const filteredJobs = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return form.jobs
      .filter((job) => (jobsTab === STATUS_ACTIVE ? job.isOpen : !job.isOpen))
      .filter((job) => {
        if (!keyword) return true
        return (
          job.title.toLowerCase().includes(keyword) ||
          job.slug.toLowerCase().includes(keyword) ||
          job.locationLabel.toLowerCase().includes(keyword)
        )
      })
  }, [form.jobs, jobsTab, query])

  const openCreateTabDialog = () => {
    setTabDialogErrors({ label: '', key: '' })
    setTabDialog({ isOpen: true, mode: 'create', label: '', targetKey: '' })
  }

  const openEditTabDialog = (tab) => {
    if (tab.key === 'all') return
    setTabDialogErrors({ label: '', key: '' })
    setTabDialog({ isOpen: true, mode: 'edit', label: tab.label, targetKey: tab.key })
  }

  const closeTabDialog = () => {
    setTabDialogErrors({ label: '', key: '' })
    setTabDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const computedTabDialogKey = useMemo(() => {
    if (!tabDialog.isOpen) return ''
    if (tabDialog.mode === 'edit') return tabDialog.targetKey
    return buildUniqueTabKey(tabDialog.label, form.tabs)
  }, [tabDialog.isOpen, tabDialog.mode, tabDialog.targetKey, tabDialog.label, form.tabs])

  const validateTabDialog = () => {
    const label = String(tabDialog.label ?? '').trim()
    const key = String(computedTabDialogKey ?? '').trim().toLowerCase()
    const nextErrors = { label: '', key: '' }

    if (!label) nextErrors.label = 'Label is required.'
    if (!key) nextErrors.key = 'Key cannot be generated. Please provide a valid label.'
    if (key === 'all') nextErrors.key = 'Key "all" is reserved.'

    setTabDialogErrors(nextErrors)
    return !nextErrors.label && !nextErrors.key
  }

  const saveTabDialog = () => {
    if (!validateTabDialog()) return

    const key = String(computedTabDialogKey ?? '').trim().toLowerCase()
    const label = String(tabDialog.label ?? '').trim()

    if (tabDialog.mode === 'create') {
      setForm((prev) => ({ ...prev, tabs: [...prev.tabs, { key, label, sortOrder: prev.tabs.length }] }))
      closeTabDialog()
      return
    }

    setForm((prev) => ({
      ...prev,
      tabs: prev.tabs.map((item) => (item.key === tabDialog.targetKey ? { ...item, label } : item)),
    }))
    closeTabDialog()
  }

  const requestDeleteTab = (tab) => {
    if (tab.key === 'all') {
      setRemindDialog({
        isOpen: true,
        title: 'Unable to Delete Tab',
        description: 'The "all" tab is reserved by system and cannot be deleted.',
      })
      return
    }
    const linkedJobsCount = form.jobs.filter((job) => job.countryCode === tab.key).length
    if (linkedJobsCount > 0) {
      setRemindDialog({
        isOpen: true,
        title: 'Unable to Delete Tab',
        description: `There are still ${linkedJobsCount} jobs assigned to this region. Reassign or archive them before deleting this tab.`,
      })
      return
    }
    setDeleteTabTarget(tab)
  }

  const confirmDeleteTab = () => {
    if (!deleteTabTarget?.key) return
    setForm((prev) => ({
      ...prev,
      tabs: prev.tabs.filter((tab) => tab.key !== deleteTabTarget.key),
    }))
    setDeleteTabTarget(null)
  }

  const requestArchiveToggle = (job) => {
    if (!job.isOpen) {
      setForm((prev) => ({
        ...prev,
        jobs: prev.jobs.map((item) => (item.id === job.id ? { ...item, isOpen: true } : item)),
      }))
      return
    }
    setArchiveTarget(job)
  }

  const confirmArchiveToggle = () => {
    if (!archiveTarget?.id) return
    setForm((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) => (job.id === archiveTarget.id ? { ...job, isOpen: false } : job)),
    }))
    setArchiveTarget(null)
  }

  const save = async () => {
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const result = await updateBackstageCompanyCareers(buildCareersUpdatePayload(form, editorId))
      const page = result?.data?.careersPage
      if (page) {
        setForm(normalizeCareersPayload(page))
        setUpdatedAt(page?.updatedAt ?? '')
      }
      setStatus('success')
      setSuccessMessage('Careers content saved.')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error?.message || 'Unable to save careers content.')
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Careers</h1>
            {updatedAt ? <p className="mt-1 text-xs text-slate-500">Last updated: {updatedAt}</p> : null}
          </div>
          <button
            type="button"
            onClick={save}
            disabled={status === 'saving'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {status === 'saving' ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <StatusMessage tone="error" message={errorMessage} />
      <StatusMessage tone="success" message={successMessage} />

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Region Tabs</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateTabDialog}
              className={`inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 ${isTabsExpanded ? '' : 'hidden'}`}
            >
              <PlusIcon className="h-4 w-4" />
              Add Tab
            </button>
            <button
              type="button"
              onClick={() => setIsTabsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              aria-expanded={isTabsExpanded}
              aria-label={isTabsExpanded ? 'Collapse region tabs' : 'Expand region tabs'}
            >
              {isTabsExpanded ? 'Collapse' : 'Expand'}
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-300 ${isTabsExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isTabsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full table-fixed border-collapse text-left text-sm text-slate-700">
                  <colgroup>
                    <col className="w-[180px]" />
                    <col />
                    <col className="w-[180px]" />
                  </colgroup>
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Key</th>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.tabs.map((tab) => (
                      <tr key={tab.key} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{tab.key}</td>
                        <td className="px-4 py-3">{tab.label}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => openEditTabDialog(tab)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Edit</button>
                            <button type="button" onClick={() => requestDeleteTab(tab)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Jobs</h2>
          <button
            type="button"
            onClick={() => navigate('/pages/content/company/careers/new')}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <PlusIcon className="h-4 w-4" />
            Add Job
          </button>
        </div>

        <div className="flex items-center gap-6 border-b border-slate-200">
          <button type="button" onClick={() => setJobsTab(STATUS_ACTIVE)} className={`border-b-2 pb-2 text-sm font-medium ${jobsTab === STATUS_ACTIVE ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Active</button>
          <button type="button" onClick={() => setJobsTab(STATUS_ARCHIVED)} className={`border-b-2 pb-2 text-sm font-medium ${jobsTab === STATUS_ARCHIVED ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Archived</button>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); setQuery(queryInput.trim()) }} className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title or slug"
            className="h-10 w-full max-w-sm rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
          />
          <button type="submit" className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50">Search</button>
        </form>

        <div className="rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] table-auto border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[48px] px-4 py-3">ID</th>
                  <th className="w-[100px] px-4 py-3">Image</th>
                  <th className="w-[200px] px-4 py-3">Title</th>
                  <th className="w-[220px] px-4 py-3">Slug</th>
                  <th className="w-[120px] px-4 py-3">Country</th>
                  <th className="w-[180px] px-4 py-3">Type</th>
                  <th className="w-[220px] px-4 py-3">Location</th>
                  <th className="w-[120px] px-4 py-3">Status</th>
                  <th className="w-[180px] px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">No jobs found.</td>
                  </tr>
                ) : (
                  filteredJobs.map((job, index) => (
                    <tr key={job.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        {job.imageUrl ? <img src={job.imageUrl} alt={job.title} className="h-10 w-10 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">IMG</div>}
                      </td>
                      <td className="max-w-[220px] px-4 py-3"><p className="truncate font-medium text-slate-900" title={job.title}>{job.title}</p></td>
                      <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-slate-600"><p className="truncate" title={job.slug}>{job.slug}</p></td>
                      <td className="px-4 py-3 text-slate-600">{job.countryCode}</td>
                      <td className="px-4 py-3 text-slate-600">{job.employmentType}</td>
                      <td className="max-w-[240px] px-4 py-3 text-slate-600"><p className="truncate" title={job.locationLabel}>{job.locationLabel}</p></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${job.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                          {job.isOpen ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/pages/content/company/careers/${job.slug}/edit`} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Edit</Link>
                          <button type="button" onClick={() => requestArchiveToggle(job)} className={`rounded-md border px-3 py-1.5 text-xs ${job.isOpen ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                            {job.isOpen ? 'Archive' : 'Restore'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {tabDialog.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-lg rounded-xl border border-indigo-300 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">{tabDialog.mode === 'create' ? 'Add Tab' : 'Edit Tab'}</h3>
              <button type="button" onClick={closeTabDialog} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"><XMarkIcon className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-4">
              <FormField label="Key" required error={tabDialogErrors.key}>
                <input
                  value={computedTabDialogKey}
                  readOnly
                  placeholder="Auto-generated from label"
                  className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500 outline-none"
                />
              </FormField>
              <FormField label="Label" required error={tabDialogErrors.label}>
                <input
                  value={tabDialog.label}
                  onChange={(event) => setTabDialog((prev) => ({ ...prev, label: event.target.value }))}
                  onBlur={validateTabDialog}
                  placeholder="e.g. Southeast Asia"
                  className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
                />
              </FormField>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button type="button" onClick={closeTabDialog} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveTabDialog} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleteTabTarget)}
        title="Delete Tab"
        description={`Delete "${deleteTabTarget?.label ?? ''}" tab?`}
        confirmLabel="Delete"
        onConfirm={confirmDeleteTab}
        onCancel={() => setDeleteTabTarget(null)}
      />
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title="Archive Job"
        description={`Archive "${archiveTarget?.title ?? ''}"?`}
        confirmLabel="Archive"
        onConfirm={confirmArchiveToggle}
        onCancel={() => setArchiveTarget(null)}
      />
      <RemindDialog
        isOpen={remindDialog.isOpen}
        title={remindDialog.title}
        description={remindDialog.description}
        onAcknowledge={() => setRemindDialog({ isOpen: false, title: '', description: '' })}
      />
    </section>
  )
}

export default CareersPageEditor
