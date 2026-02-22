import { useCallback, useEffect, useMemo, useState } from 'react'
import { EyeIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import {
  fetchBannerHubPageFromApi,
  updateBannerHubCore,
  updateBannerHubDetail,
  updateBannerHubProductDetails,
  uploadDatasheetForProduct,
} from '../../../api/backstageBannerHubApi'
import { useAuth } from '../../../features/auth/AuthContext'
import Pagination from '../../common/Pagination'
import StatusMessage from '../../common/StatusMessage'
import BannerHubRowEditorDrawer from './BannerHubRowEditorDrawer'

const TAB_CORE = 'core'
const TAB_DETAIL = 'detail'
const TAB_PRODUCT = 'product'
const DEFAULT_LIMIT = 10

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Unable to read selected file'))
    reader.readAsDataURL(file)
  })

const getDownloadUrl = (url) => {
  if (!url) return ''
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}download=true`
}

const ActionIconButton = ({ label, onClick, disabled = false, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
)

const BannerHubManagerContent = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(TAB_CORE)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [coreItems, setCoreItems] = useState([])
  const [detailItems, setDetailItems] = useState([])
  const [productItems, setProductItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [loadedTabs, setLoadedTabs] = useState({ core: false, detail: false, product: false })
  const [paging, setPaging] = useState({
    core: { limit: DEFAULT_LIMIT, offset: 0, totalCount: 0 },
    detail: { limit: DEFAULT_LIMIT, offset: 0, totalCount: 0 },
    product: { limit: DEFAULT_LIMIT, offset: 0, totalCount: 0 },
  })

  const editorId = useMemo(() => user?.email ?? user?.name ?? 'unknown-editor', [user])

  const loadTabData = useCallback(async (tab, currentPaging) => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetchBannerHubPageFromApi({
        tab,
        limit: currentPaging.limit,
        offset: currentPaging.offset,
      })
      if (response.code !== 0) throw new Error(response.message || 'Failed to load Banner Hub data')

      if (tab === TAB_CORE) {
        setCoreItems(response.items)
      } else if (tab === TAB_DETAIL) {
        setDetailItems(response.items)
      } else {
        setProductItems(response.items)
      }

      setPaging((prev) => ({
        ...prev,
        [tab]: {
          limit: response.pagination.limit,
          offset: response.pagination.offset,
          totalCount: response.pagination.totalCount,
        },
      }))

      setLoadedTabs((prev) => ({ ...prev, [tab]: true }))
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to load Banner Hub data.')
    }
  }, [])

  useEffect(() => {
    loadTabData(TAB_CORE, { limit: DEFAULT_LIMIT, offset: 0 })
  }, [loadTabData])

  useEffect(() => {
    if (!loadedTabs[activeTab]) {
      loadTabData(activeTab, paging[activeTab])
    }
  }, [activeTab, loadedTabs, paging, loadTabData])

  const changeTabPage = (tab, page) => {
    const nextPaging = {
      ...paging[tab],
      offset: Math.max(0, (page - 1) * paging[tab].limit),
    }
    loadTabData(tab, nextPaging)
  }

  const changeTabLimit = (tab, limit) => {
    const nextPaging = {
      ...paging[tab],
      limit,
      offset: 0,
    }
    loadTabData(tab, nextPaging)
  }

  const saveCurrentTab = async () => {
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (activeTab === TAB_CORE) {
        await updateBannerHubCore({
          items: coreItems.map((item) => ({
            pageKey: item.pageKey,
            eyebrow: item.eyebrow,
            title: item.title,
            description: item.description,
          })),
          updatedBy: editorId,
        })
      } else if (activeTab === TAB_DETAIL) {
        await updateBannerHubDetail({
          items: detailItems.map((item) => ({
            entityType: item.entityType,
            slug: item.slug,
            pageKey: item.pageKey,
            eyebrow: item.eyebrow,
            title: item.title,
            description: item.description,
            backgroundImageUrl: item.backgroundImageUrl,
          })),
          updatedBy: editorId,
        })
      } else {
        await updateBannerHubProductDetails({
          items: productItems.map((item) => ({
            slug: item.slug,
            pageKey: item.pageKey,
            eyebrow: item.eyebrow,
            title: item.title,
            description: item.description,
            backgroundImageUrl: item.backgroundImageUrl,
            datasheetUrl: item.datasheetUrl,
            datasheetName: item.datasheetName,
            datasheetMimeType: item.datasheetMimeType,
          })),
          updatedBy: editorId,
        })
      }

      setStatus('success')
      setSuccessMessage('Banner Hub saved successfully.')
      loadTabData(activeTab, paging[activeTab])
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to save Banner Hub.')
    }
  }

  const uploadDatasheet = async (index, file) => {
    if (!file) return
    setStatus('saving')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const target = productItems[index]
      if (!target?.slug) throw new Error('Product slug is missing')

      const contentBase64 = await readFileAsBase64(file)
      const response = await uploadDatasheetForProduct({
        productSlug: target.slug,
        fileName: file.name,
        contentBase64,
        mimeType: file.type,
        updatedBy: editorId,
      })

      setProductItems((prev) =>
        prev.map((item, idx) =>
          idx === index
            ? {
                ...item,
                datasheetUrl: response?.data?.datasheetUrl ?? item.datasheetUrl,
                datasheetName: response?.data?.datasheetName ?? file.name,
                datasheetMimeType: response?.data?.datasheetMimeType ?? item.datasheetMimeType,
              }
            : item
        )
      )

      setStatus('success')
      setSuccessMessage('Datasheet uploaded successfully.')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Unable to upload datasheet.')
    }
  }

  const openRowEditor = (tab, index, item) => {
    setEditing({ tab, index, item })
  }

  const applyEditedRow = (draft) => {
    if (!editing) return

    if (editing.tab === TAB_CORE) {
      setCoreItems((prev) => prev.map((item, index) => (index === editing.index ? { ...item, ...draft } : item)))
    } else if (editing.tab === TAB_DETAIL) {
      setDetailItems((prev) => prev.map((item, index) => (index === editing.index ? { ...item, ...draft } : item)))
    } else {
      setProductItems((prev) =>
        prev.map((item, index) => (index === editing.index ? { ...item, ...draft } : item))
      )
    }

    setEditing(null)
  }

  const closeEditor = () => setEditing(null)

  const renderThumb = (src, alt) =>
    src ? (
      <img src={src} alt={alt} className="h-12 w-20 rounded border border-slate-200 object-cover" />
    ) : (
      <div className="flex h-12 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-[11px] text-slate-400">
        No image
      </div>
    )

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Banner Hub</h1>
          <button
            type="button"
            onClick={saveCurrentTab}
            disabled={status === 'loading' || status === 'saving'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving...' : 'Save Current Tab'}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab(TAB_CORE)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              activeTab === TAB_CORE
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Level-1 Banners
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TAB_DETAIL)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              activeTab === TAB_DETAIL
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Level-2 Banners
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TAB_PRODUCT)}
            className={`border-b-2 pb-2 text-sm font-medium ${
              activeTab === TAB_PRODUCT
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Product Banners
          </button>
        </div>
      </div>

      <StatusMessage tone="error" message={errorMessage} />
      <StatusMessage tone="success" message={successMessage} />

      {status === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading banner data...</div>
      ) : null}

      {status !== 'loading' && activeTab === TAB_CORE ? (
        <section className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-w-full overflow-x-auto">
            <table className="w-max min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-12 px-3 py-2 text-left font-medium text-slate-600">ID</th>
                  <th className="w-[180px] px-3 py-2 text-left font-medium text-slate-600">Page</th>
                  <th className="w-[180px] px-3 py-2 text-left font-medium text-slate-600">Eyebrow</th>
                  <th className="w-[380px] px-3 py-2 text-left font-medium text-slate-600">Title</th>
                  <th className="w-[560px] px-3 py-2 text-left font-medium text-slate-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coreItems.map((item, index) => (
                  <tr
                    key={item.pageKey}
                    onClick={() => openRowEditor(TAB_CORE, index, item)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-3 py-4 text-slate-500">{paging.core.offset + index + 1}</td>
                    <td className="max-w-[180px] px-3 py-4 font-medium text-slate-800">{item.label}</td>
                    <td className="px-3 py-4 text-slate-700">
                      <p className="block max-w-[180px] truncate whitespace-nowrap">{item.eyebrow || '-'}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      <p className="block max-w-[380px] truncate whitespace-nowrap">{item.title || '-'}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      <p className="block max-w-[560px] truncate whitespace-nowrap">{item.description || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            totalCount={paging.core.totalCount}
            limit={paging.core.limit}
            offset={paging.core.offset}
            onPageChange={(page) => changeTabPage(TAB_CORE, page)}
            onLimitChange={(limit) => changeTabLimit(TAB_CORE, limit)}
          />
        </section>
      ) : null}

      {status !== 'loading' && activeTab === TAB_DETAIL ? (
        <section className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-w-full overflow-x-auto">
            <table className="w-max min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-12 px-3 py-4 text-left font-medium text-slate-600">ID</th>
                  <th className="w-[260px] px-3 py-4 text-left font-medium text-slate-600">Page</th>
                  <th className="w-[120px] px-3 py-4 text-left font-medium text-slate-600">Image</th>
                  <th className="w-[180px] px-3 py-4 text-left font-medium text-slate-600">Eyebrow</th>
                  <th className="w-[180px] px-3 py-4 text-left font-medium text-slate-600">Title</th>
                  <th className="w-[460px] px-3 py-4 text-left font-medium text-slate-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailItems.map((item, index) => (
                  <tr
                    key={item.pageKey}
                    onClick={() => openRowEditor(TAB_DETAIL, index, item)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-3 py-4 text-slate-500">{paging.detail.offset + index + 1}</td>
                    <td className="px-3 py-4 font-medium text-slate-800">{item.label}</td>
                    <td className="px-3 py-4">{renderThumb(item.backgroundImageUrl, item.label)}</td>
                    <td className="px-3 py-4 text-slate-700">
                      <p className="block max-w-[240px] truncate whitespace-nowrap">{item.eyebrow || '-'}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      <p className="block max-w-[180px] truncate whitespace-nowrap">{item.title || '-'}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      <p className="block max-w-[460px] truncate whitespace-nowrap">{item.description || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            totalCount={paging.detail.totalCount}
            limit={paging.detail.limit}
            offset={paging.detail.offset}
            onPageChange={(page) => changeTabPage(TAB_DETAIL, page)}
            onLimitChange={(limit) => changeTabLimit(TAB_DETAIL, limit)}
          />
        </section>
      ) : null}

      {status !== 'loading' && activeTab === TAB_PRODUCT ? (
        <section className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-w-full overflow-x-auto">
            <table className="w-max min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-12 px-3 py-2 text-left font-medium text-slate-600">ID</th>
                  <th className="w-[160px] px-3 py-2 text-left font-medium text-slate-600">Slug</th>
                  <th className="w-[160px] px-3 py-2 text-left font-medium text-slate-600">Image</th>
                  <th className="w-[160px] px-3 py-2 text-left font-medium text-slate-600">Eyebrow</th>
                  <th className="w-[180px] px-3 py-2 text-left font-medium text-slate-600">Title</th>
                  <th className="w-[380px] px-3 py-2 text-left font-medium text-slate-600">Description</th>
                  <th className="w-[180px] px-3 py-2 text-left font-medium text-slate-600">Datasheet Name</th>
                  <th className="w-[140px] px-3 py-2 text-left font-medium text-slate-600">Datasheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productItems.map((item, index) => (
                  <tr
                    key={item.pageKey}
                    onClick={() => openRowEditor(TAB_PRODUCT, index, item)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-slate-500">{paging.product.offset + index + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{item.slug}</td>
                    <td className="px-3 py-2">{renderThumb(item.backgroundImageUrl, item.slug)}</td>
                    <td className="px-3 py-2 text-slate-700">
                      <p className="block max-w-[200px] truncate whitespace-nowrap">{item.eyebrow || '-'}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <p className="block max-w-[300px] truncate whitespace-nowrap">{item.title || '-'}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <p className="block max-w-[380px] truncate whitespace-nowrap">{item.description || '-'}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <p className="block max-w-[280px] truncate whitespace-nowrap">{item.datasheetName || '-'}</p>
                    </td>
                    <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <ActionIconButton
                          label="Preview Datasheet"
                          onClick={() => item.datasheetUrl && window.open(item.datasheetUrl, '_blank', 'noopener,noreferrer')}
                          disabled={!item.datasheetUrl}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </ActionIconButton>
                        <ActionIconButton
                          label="Download Datasheet"
                          onClick={() => {
                            const url = getDownloadUrl(item.datasheetUrl)
                            if (url) window.open(url, '_blank', 'noopener,noreferrer')
                          }}
                          disabled={!item.datasheetUrl}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </ActionIconButton>
                        <label className="cursor-pointer" title="Upload Datasheet (PDF)">
                          <span className="sr-only">Upload Datasheet</span>
                          <span className="inline-flex rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                            <ArrowUpTrayIcon className="h-4 w-4" />
                          </span>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              uploadDatasheet(index, file)
                              event.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            totalCount={paging.product.totalCount}
            limit={paging.product.limit}
            offset={paging.product.offset}
            onPageChange={(page) => changeTabPage(TAB_PRODUCT, page)}
            onLimitChange={(limit) => changeTabLimit(TAB_PRODUCT, limit)}
          />
        </section>
      ) : null}

      <BannerHubRowEditorDrawer
        key={editing ? `${editing.tab}-${editing.item?.pageKey ?? editing.item?.slug ?? editing.index}` : 'none'}
        isOpen={Boolean(editing)}
        tab={editing?.tab}
        item={editing?.item}
        onClose={closeEditor}
        onApply={applyEditedRow}
      />
    </section>
  )
}

export default BannerHubManagerContent
