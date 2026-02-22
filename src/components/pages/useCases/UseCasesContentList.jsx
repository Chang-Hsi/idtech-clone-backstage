import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pagination from '../../common/Pagination'
import StatusMessage from '../../common/StatusMessage'
import ConfirmDialog from '../../dialog/ConfirmDialog'
import { useAuth } from '../../../features/auth/AuthContext'
import {
  archiveBackstageUseCase,
  fetchBackstageUseCases,
  restoreBackstageUseCase,
} from '../../../api/backstageContentUseCasesApi'

const TAB_ACTIVE = 'active'
const TAB_ARCHIVED = 'archived'

const UseCasesContentList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [activeTab, setActiveTab] = useState(TAB_ACTIVE)
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [items, setItems] = useState([])
  const [actionTarget, setActionTarget] = useState(null)
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, totalCount: 0 })

  const loadUseCases = useCallback(async ({ limit, offset, q, status }) => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const payload = await fetchBackstageUseCases({ limit, offset, q, status })
      const data = payload?.data ?? {}
      const page = data?.pagination ?? {}

      setItems(Array.isArray(data?.items) ? data.items : [])
      setPagination({
        limit: Number.isFinite(page?.limit) ? page.limit : limit,
        offset: Number.isFinite(page?.offset) ? page.offset : offset,
        totalCount: Number.isFinite(page?.totalCount) ? page.totalCount : 0,
      })
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to load use cases.')
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadUseCases({
        limit: pagination.limit,
        offset: 0,
        q: query,
        status: activeTab,
      })
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [activeTab, query, pagination.limit, loadUseCases])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setQuery(queryInput.trim())
  }

  const handlePageChange = (page) => {
    const nextOffset = (page - 1) * pagination.limit
    loadUseCases({
      limit: pagination.limit,
      offset: nextOffset,
      q: query,
      status: activeTab,
    })
  }

  const handleLimitChange = (limit) => {
    loadUseCases({
      limit,
      offset: 0,
      q: query,
      status: activeTab,
    })
  }

  const handleArchiveToggle = async (item) => {
    if (item.status !== 'archived') {
      setActionTarget(item)
      return
    }

    setStatus('saving')
    setErrorMessage('')

    try {
      await restoreBackstageUseCase(item.slug, editorId)
      loadUseCases({
        limit: pagination.limit,
        offset: pagination.offset,
        q: query,
        status: activeTab,
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to update use case status.')
    }
  }

  const confirmArchive = async () => {
    if (!actionTarget?.slug) return
    setStatus('saving')
    setErrorMessage('')

    try {
      await archiveBackstageUseCase(actionTarget.slug, editorId)
      setActionTarget(null)
      loadUseCases({
        limit: pagination.limit,
        offset: pagination.offset,
        q: query,
        status: activeTab,
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to update use case status.')
    }
  }

  const renderImage = (url, title) =>
    url ? (
      <img
        src={url}
        alt={title}
        className="h-10 w-10 rounded-full border border-slate-200 object-cover"
      />
    ) : (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
        IMG
      </div>
    )

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Use Cases</h1>
          <button
            type="button"
            onClick={() => navigate('/pages/content/use-cases/new')}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New Use Case
          </button>
        </div>

        <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab(TAB_ACTIVE)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              activeTab === TAB_ACTIVE
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TAB_ARCHIVED)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              activeTab === TAB_ARCHIVED
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Archived
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title or slug"
            className="h-10 w-full max-w-sm rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            Search
          </button>
        </form>
      </div>

      <StatusMessage tone="error" message={errorMessage} />
      {status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading use cases...</div>
      ) : null}

      {status !== 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] table-auto border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[48px] px-4 py-3">ID</th>
                  <th className="w-[120px] px-4 py-3">Image</th>
                  <th className="w-[180px] px-4 py-3">Title</th>
                  <th className="w-[180px] px-4 py-3">Slug</th>
                  <th className="w-[180px] px-4 py-3">Products</th>
                  <th className="w-[180px] px-4 py-3">Updated At</th>
                  <th className="w-[320px] px-4 py-3">Status</th>
                  <th className="w-[180px] px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No use cases found.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.slug} className="border-t border-slate-200">
                      <td className="px-4 py-3 align-middle text-slate-500">{pagination.offset + index + 1}</td>
                      <td className="px-4 py-3 align-middle">{renderImage(item.imageUrl, item.title)}</td>
                      <td className="max-w-[280px] px-4 py-3 align-middle">
                        <p className="truncate font-medium text-slate-900" title={item.title}>
                          {item.title}
                        </p>
                      </td>
                      <td className="max-w-[240px] px-4 py-3 align-middle text-slate-600">
                        <p className="truncate" title={item.slug}>
                          {item.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle text-slate-600">{item.productsCount ?? 0}</td>
                      <td className="px-4 py-3 align-middle text-slate-600">{item.updatedAtLabel ?? '-'}</td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            item.status === 'archived'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.status === 'archived' ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/pages/content/use-cases/${item.slug}/edit`)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchiveToggle(item)}
                            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                              item.status === 'archived'
                                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {item.status === 'archived' ? 'Restore' : 'Archive'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            totalCount={pagination.totalCount}
            limit={pagination.limit}
            offset={pagination.offset}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(actionTarget)}
        title="Archive use case?"
        description={`"${actionTarget?.title ?? ''}" will be archived and moved to Archived tab.`}
        confirmLabel="Archive"
        onCancel={() => setActionTarget(null)}
        onConfirm={confirmArchive}
      />
    </section>
  )
}

export default UseCasesContentList
