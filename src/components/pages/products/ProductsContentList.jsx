import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Pagination from '../../common/Pagination'
import DropdownSelect from '../../common/DropdownSelect'
import StatusMessage from '../../common/StatusMessage'
import { useAuth } from '../../../features/auth/AuthProvider'
import ConfirmDialog from '../../dialog/ConfirmDialog'
import {
  archiveBackstageProduct,
  fetchBackstageProducts,
  restoreBackstageProduct,
} from '../../../api/backstageContentProductsApi'

const TAB_ACTIVE = 'active'
const TAB_ARCHIVED = 'archived'

const ProductsContentList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const [activeTab, setActiveTab] = useState(TAB_ACTIVE)
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState('')
  const [selectedUseCaseSlug, setSelectedUseCaseSlug] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [items, setItems] = useState([])
  const [collectionOptions, setCollectionOptions] = useState([])
  const [useCaseOptions, setUseCaseOptions] = useState([])
  const [actionTarget, setActionTarget] = useState(null)
  const [pagination, setPagination] = useState({ limit: 10, offset: 0, totalCount: 0 })

  const loadProducts = useCallback(async ({ limit, offset, q, status, collectionSlug, useCaseSlug }) => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const payload = await fetchBackstageProducts({
        limit,
        offset,
        q,
        status,
        collectionSlug,
        useCaseSlug,
      })
      const data = payload?.data ?? {}
      const page = data?.pagination ?? {}
      const filterOptions = data?.filterOptions ?? {}

      setItems(Array.isArray(data?.items) ? data.items : [])
      setPagination({
        limit: Number.isFinite(page?.limit) ? page.limit : limit,
        offset: Number.isFinite(page?.offset) ? page.offset : offset,
        totalCount: Number.isFinite(page?.totalCount) ? page.totalCount : 0,
      })
      setCollectionOptions(Array.isArray(filterOptions?.collections) ? filterOptions.collections : [])
      setUseCaseOptions(Array.isArray(filterOptions?.useCases) ? filterOptions.useCases : [])
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to load products.')
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadProducts({
        limit: pagination.limit,
        offset: 0,
        q: query,
        status: activeTab,
        collectionSlug: selectedCollectionSlug,
        useCaseSlug: selectedUseCaseSlug,
      })
    }, 0)
    return () => window.clearTimeout(timerId)
  }, [activeTab, query, pagination.limit, selectedCollectionSlug, selectedUseCaseSlug, loadProducts])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    setQuery(queryInput.trim())
  }

  const handlePageChange = (page) => {
    const next = {
      ...pagination,
      offset: (page - 1) * pagination.limit,
    }
    loadProducts({
      limit: next.limit,
      offset: next.offset,
      q: query,
      status: activeTab,
      collectionSlug: selectedCollectionSlug,
      useCaseSlug: selectedUseCaseSlug,
    })
  }

  const handleLimitChange = (limit) => {
    const next = {
      ...pagination,
      limit,
      offset: 0,
    }
    loadProducts({
      limit: next.limit,
      offset: next.offset,
      q: query,
      status: activeTab,
      collectionSlug: selectedCollectionSlug,
      useCaseSlug: selectedUseCaseSlug,
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
      await restoreBackstageProduct(item.slug, editorId)

      loadProducts({
        limit: pagination.limit,
        offset: pagination.offset,
        q: query,
        status: activeTab,
        collectionSlug: selectedCollectionSlug,
        useCaseSlug: selectedUseCaseSlug,
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to update product status.')
    }
  }

  const confirmArchive = async () => {
    if (!actionTarget?.slug) return
    setStatus('saving')
    setErrorMessage('')

    try {
      await archiveBackstageProduct(actionTarget.slug, editorId)
      setActionTarget(null)
      loadProducts({
        limit: pagination.limit,
        offset: pagination.offset,
        q: query,
        status: activeTab,
        collectionSlug: selectedCollectionSlug,
        useCaseSlug: selectedUseCaseSlug,
      })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to update product status.')
    }
  }

  const renderImage = (url, name) =>
    url ? (
      <img
        src={url}
        alt={name}
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
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <button
            type="button"
            onClick={() => navigate('/pages/content/products/new')}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New Product
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
            placeholder="Search by name or slug"
            className="h-10 w-full max-w-sm rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
          />
          <DropdownSelect
            value={selectedUseCaseSlug}
            onChange={setSelectedUseCaseSlug}
            placeholder="All Use Cases"
            className="w-48"
            options={useCaseOptions.map((option) => ({
              value: option.slug,
              label: option.label,
            }))}
          />
          <DropdownSelect
            value={selectedCollectionSlug}
            onChange={setSelectedCollectionSlug}
            placeholder="All Collections"
            className="w-52"
            options={collectionOptions.map((option) => ({
              value: option.slug,
              label: option.label,
            }))}
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading products...</div>
      ) : null}

      {status !== 'loading' ? (
        <section className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-w-full overflow-x-auto">
            <table className="w-max min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-12 px-3 py-3 text-left font-medium text-slate-600">ID</th>
                  <th className="w-20 px-3 py-3 text-left font-medium text-slate-600">Image</th>
                  <th className="w-[260px] px-3 py-3 text-left font-medium text-slate-600">Name</th>
                  <th className="w-[220px] px-3 py-3 text-left font-medium text-slate-600">Slug</th>
                  <th className="w-[140px] px-3 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="w-[180px] px-3 py-3 text-left font-medium text-slate-600">Collection Count</th>
                  <th className="w-[220px] px-3 py-3 text-left font-medium text-slate-600">Updated At</th>
                  <th className="w-[190px] px-3 py-3 text-left font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.slug} className="hover:bg-slate-50">
                    <td className="px-3 py-3 text-slate-500">{pagination.offset + index + 1}</td>
                    <td className="px-3 py-3">{renderImage(item.imageUrl, item.name)}</td>
                    <td className="px-3 py-3 text-slate-800">
                      <p className="max-w-[260px] truncate whitespace-nowrap font-medium">{item.name}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <p className="max-w-[220px] truncate whitespace-nowrap">{item.slug}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          item.status === 'archived'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.status === 'archived' ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{item.collectionCount ?? 0}</td>
                    <td className="px-3 py-3 text-slate-700">{item.updatedAtLabel}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/pages/content/products/${item.slug}/edit`}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
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
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 h-10 text-center text-sm text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : null}
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
        </section>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(actionTarget)}
        title="Archive product?"
        description={`"${actionTarget?.name ?? ''}" will be archived and moved to Archived tab.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmArchive}
        onCancel={() => setActionTarget(null)}
      />
    </section>
  )
}

export default ProductsContentList
