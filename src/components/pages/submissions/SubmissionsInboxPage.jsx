import {
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'
import { createElement } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Pagination from '../../common/Pagination'
import StatusMessage from '../../common/StatusMessage'
import {
  archiveBackstageSubmission,
  fetchBackstageSubmissionDetail,
  fetchBackstageSubmissions,
  getBackstageSubmissionResumeDownloadUrl,
  restoreBackstageSubmission,
  updateBackstageSubmissionStatus,
} from '../../../api/backstageSubmissionsApi'

const SOURCE_LABEL = {
  lead: 'Lead Messages',
  contact: 'Contact Messages',
  career: 'Career Applications',
}

const STATUS_LABEL = {
  new: 'Pending Review',
  resolved: 'Completed',
  archived: 'Archived',
}

const STATUS_BADGE_STYLES = {
  new: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-200 text-slate-700',
}

const DETAIL_SECRET_KEYS = new Set(['captchaToken', 'gRecaptchaToken', 'recaptchaToken', 'website'])

const formatDateTime = (value) => {
  const timestamp = Date.parse(String(value ?? ''))
  if (!Number.isFinite(timestamp)) return '--'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

const resolvePreviewValue = (candidates) => {
  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim()
    if (value) return value
  }
  return '--'
}

const extractCareerJobFromMessage = (message) => {
  const text = String(message ?? '').trim()
  const match = text.match(/^Career application for\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

const getSubmissionPreviewFields = (source, payload, message = '') => {
  const data = payload && typeof payload === 'object' ? payload : {}
  const job = resolvePreviewValue(
    source === 'career'
      ? [
          data.jobTitle,
          data.job,
          data.position,
          data.role,
          data.title,
          data.jobSlug,
          extractCareerJobFromMessage(message),
        ]
      : source === 'lead'
        ? [data.company, data.industry]
        : [data.subject, data.product, data.company],
  )
  const region = resolvePreviewValue([data.region, data.location, data.country])

  return { job, region }
}

const formatPayloadLabel = (key) =>
  String(key ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const formatDetailValue = (value) => {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'string') return value.trim() || '--'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return '--'
  }
}

const SubmissionsInboxPage = ({ source, status }) => {
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [requestState, setRequestState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [items, setItems] = useState([])
  const [actingSubmissionId, setActingSubmissionId] = useState(null)
  const [detailLoadingId, setDetailLoadingId] = useState(null)
  const [detailDialogKey, setDetailDialogKey] = useState(0)
  const [detailState, setDetailState] = useState({
    isOpen: false,
    isLoading: false,
    errorMessage: '',
    submission: null,
    auditLogs: [],
  })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })

  const pageTitle = `${SOURCE_LABEL[source] ?? 'Messages'} / ${STATUS_LABEL[status] ?? 'List'}`

  const loadSubmissions = useCallback(
    async ({ page, pageSize, keyword }) => {
      setRequestState('loading')
      setErrorMessage('')

      try {
        const payload = await fetchBackstageSubmissions({
          source,
          status,
          keyword,
          page,
          pageSize,
        })

        const data = payload?.data ?? {}
        const nextItems = Array.isArray(data?.items) ? data.items : []
        const nextPagination = data?.pagination ?? {}

        setItems(nextItems)
        setPagination({
          page: Number.isFinite(nextPagination?.page) ? nextPagination.page : page,
          pageSize: Number.isFinite(nextPagination?.pageSize) ? nextPagination.pageSize : pageSize,
          total: Number.isFinite(nextPagination?.total) ? nextPagination.total : 0,
          totalPages: Number.isFinite(nextPagination?.totalPages) ? nextPagination.totalPages : 1,
        })
        setRequestState('success')
      } catch (error) {
        setRequestState('error')
        setErrorMessage(error.message || 'Unable to load submissions.')
      }
    },
    [source, status],
  )

  useEffect(() => {
    setQueryInput('')
    setQuery('')
    loadSubmissions({
      page: 1,
      pageSize: pagination.pageSize,
      keyword: '',
    })
  }, [source, status, pagination.pageSize, loadSubmissions])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const nextQuery = queryInput.trim()
    setQuery(nextQuery)
    loadSubmissions({
      page: 1,
      pageSize: pagination.pageSize,
      keyword: nextQuery,
    })
  }

  const handlePageChange = (page) => {
    loadSubmissions({
      page,
      pageSize: pagination.pageSize,
      keyword: query,
    })
  }

  const handleDownloadResume = (submissionId) => {
    const downloadUrl = getBackstageSubmissionResumeDownloadUrl(submissionId)
    if (!downloadUrl) return

    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.rel = 'noopener'
    downloadLink.target = '_blank'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
  }

  const runAction = useCallback(
    async ({ submissionId, run, successText }) => {
      setActingSubmissionId(submissionId)
      setErrorMessage('')

      try {
        await run()
        setSuccessMessage(successText)
        await loadSubmissions({
          page: pagination.page,
          pageSize: pagination.pageSize,
          keyword: query,
        })
      } catch (error) {
        setErrorMessage(error.message || 'Unable to update submission status.')
      } finally {
        setActingSubmissionId(null)
      }
    },
    [loadSubmissions, pagination.page, pagination.pageSize, query],
  )

  const openDetailDialog = useCallback(async (submissionId) => {
    setDetailDialogKey((prev) => prev + 1)
    setDetailLoadingId(submissionId)
    setDetailState({
      isOpen: true,
      isLoading: true,
      errorMessage: '',
      submission: null,
      auditLogs: [],
    })

    try {
      const payload = await fetchBackstageSubmissionDetail(submissionId)
      const data = payload?.data ?? {}
      setDetailState({
        isOpen: true,
        isLoading: false,
        errorMessage: '',
        submission: data?.submission ?? null,
        auditLogs: Array.isArray(data?.auditLogs) ? data.auditLogs : [],
      })
    } catch (error) {
      setDetailState({
        isOpen: true,
        isLoading: false,
        errorMessage: error.message || 'Unable to load submission detail.',
        submission: null,
        auditLogs: [],
      })
    } finally {
      setDetailLoadingId(null)
    }
  }, [])

  const closeDetailDialog = useCallback(() => {
    setDetailState((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }, [])

  const actions = useMemo(() => {
    if (status === 'new') {
      return (item) => [
        {
          label: 'Mark Completed',
          icon: CheckCircleIcon,
          isDanger: false,
          onClick: () =>
            runAction({
              submissionId: item.id,
              run: () => updateBackstageSubmissionStatus(item.id, { status: 'resolved' }),
              successText: 'Submission marked as completed.',
            }),
        },
        {
          label: 'Archive',
          icon: ArchiveBoxIcon,
          isDanger: true,
          onClick: () =>
            runAction({
              submissionId: item.id,
              run: () => archiveBackstageSubmission(item.id),
              successText: 'Submission archived.',
            }),
        },
      ]
    }

    if (status === 'resolved') {
      return (item) => [
        {
          label: 'Move to Pending',
          icon: ArrowUturnLeftIcon,
          isDanger: false,
          onClick: () =>
            runAction({
              submissionId: item.id,
              run: () => updateBackstageSubmissionStatus(item.id, { status: 'new' }),
              successText: 'Submission moved back to pending review.',
            }),
        },
        {
          label: 'Archive',
          icon: ArchiveBoxIcon,
          isDanger: true,
          onClick: () =>
            runAction({
              submissionId: item.id,
              run: () => archiveBackstageSubmission(item.id),
              successText: 'Submission archived.',
            }),
        },
      ]
    }

    return (item) => [
      {
        label: 'Restore',
        icon: ArrowUturnLeftIcon,
        isDanger: false,
        onClick: () =>
          runAction({
            submissionId: item.id,
            run: () => restoreBackstageSubmission(item.id),
            successText: 'Submission restored to pending review.',
          }),
      },
    ]
  }, [status, runAction])

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Read-only inbox for frontend submissions. You can review status and archive, but cannot edit form content.
        </p>

        <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by name, email, or keyword"
            className="h-10 w-full max-w-md rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
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
      <StatusMessage tone="success" message={successMessage} />

      {requestState === 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading submissions...
        </div>
      ) : null}

      {requestState !== 'loading' ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] table-auto border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-[48px] px-4 py-3 text-center">ID</th>
                  <th className="w-[220px] px-4 py-3 text-center">Submitted At</th>
                  <th className="w-[180px] px-4 py-3 text-center">Name</th>
                  <th className="w-[320px] px-4 py-3 text-center">Email</th>
                  <th className="w-[160px] px-4 py-3 text-center">Phone</th>
                  <th className="w-[220px] px-4 py-3 text-center">Job</th>
                  <th className="w-[220px] px-4 py-3 text-center">Region</th>
                  <th className="w-[220px] px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const serialNo = (pagination.page - 1) * pagination.pageSize + index + 1
                    const previewFields = getSubmissionPreviewFields(source, item.payload, item.message)
                    const isActing = actingSubmissionId === item.id
                    const rowActions = actions(item)
                    const isDetailLoading = detailLoadingId === item.id
                    const hasCareerResume =
                      source === 'career' &&
                      item.payload &&
                      typeof item.payload === 'object' &&
                      !Array.isArray(item.payload) &&
                      String(item.payload.resumeUrl ?? '').trim().length > 0

                    return (
                      <tr key={item.id} className="border-t border-slate-200 align-middle">
                        <td className="align-middle px-4 py-3 text-center font-medium text-slate-500">{serialNo}</td>
                        <td className="align-middle whitespace-nowrap px-4 py-3 text-center text-slate-600">{formatDateTime(item.createdAt)}</td>
                        <td className="align-middle px-4 py-3 text-center text-slate-900">{item.name || '--'}</td>
                        <td className="align-middle max-w-[260px] px-4 py-3 text-center text-slate-700">
                          <p className="break-all" title={item.email || '--'}>
                            {item.email || '--'}
                          </p>
                        </td>
                        <td className="align-middle px-4 py-3 text-center text-slate-700">{item.phone || '--'}</td>
                        <td className="align-middle max-w-[220px] px-4 py-3 text-center text-slate-600">
                          <p className="break-words" title={previewFields.job}>
                            {previewFields.job}
                          </p>
                        </td>
                        <td className="align-middle max-w-[220px] px-4 py-3 text-center text-slate-600">
                          <p className="break-words" title={previewFields.region}>
                            {previewFields.region}
                          </p>
                        </td>
                        <td className="align-middle px-4 py-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {source !== 'career' ? (
                              <ActionIconButton
                                icon={EyeIcon}
                                tooltip={isDetailLoading ? 'Loading Details...' : 'View Details'}
                                onClick={() => openDetailDialog(item.id)}
                                disabled={isDetailLoading || isActing}
                              />
                            ) : null}
                            {hasCareerResume ? (
                              <ActionIconButton
                                icon={ArrowDownTrayIcon}
                                tooltip="Download Resume"
                                onClick={() => handleDownloadResume(item.id)}
                                disabled={isActing || isDetailLoading}
                              />
                            ) : null}
                            {rowActions.map((action) => (
                              <ActionIconButton
                                key={action.label}
                                icon={action.icon}
                                tooltip={isActing ? 'Processing...' : action.label}
                                onClick={action.onClick}
                                disabled={isActing || isDetailLoading}
                                isDanger={action.isDanger}
                              />
                            ))}
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
            totalCount={pagination.total}
            limit={pagination.pageSize}
            offset={(pagination.page - 1) * pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}

      <SubmissionDetailDialog
        key={detailDialogKey}
        isOpen={detailState.isOpen}
        isLoading={detailState.isLoading}
        errorMessage={detailState.errorMessage}
        submission={detailState.submission}
        auditLogs={detailState.auditLogs}
        onClose={closeDetailDialog}
      />
    </section>
  )
}

const ActionIconButton = ({ icon, tooltip, onClick, disabled = false, isDanger = false }) => (
  <button
    type="button"
    title={tooltip}
    aria-label={tooltip}
    onClick={onClick}
    disabled={disabled}
    className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60 ${
      isDanger
        ? 'border-red-200 text-red-600 hover:bg-red-50'
        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
    }`}
  >
    {icon ? createElement(icon, { className: 'h-4 w-4' }) : null}
    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
      {tooltip}
    </span>
  </button>
)

const ReadOnlyField = ({ label, value = '--', multiline = false, rows = 3 }) => (
  <label className="block space-y-1 text-sm">
    <span className="font-medium text-slate-700">{label}</span>
    {multiline ? (
      <textarea
        value={String(value ?? '--')}
        readOnly
        rows={rows}
        className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none"
      />
    ) : (
      <input
        value={String(value ?? '--')}
        readOnly
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-700 outline-none"
      />
    )}
  </label>
)

const SubmissionDetailDialog = ({ isOpen, isLoading, errorMessage, submission, auditLogs, onClose }) => {
  const CLOSE_ANIMATION_MS = 220
  const closeTimerRef = useRef(null)
  const [isClosing, setIsClosing] = useState(false)

  const handleRequestClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = window.setTimeout(() => {
      onClose()
    }, CLOSE_ANIMATION_MS)
  }, [isClosing, onClose])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const handleEscape = (event) => {
      if (event.key === 'Escape') handleRequestClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleRequestClose])

  if (!isOpen) return null

  const payload =
    submission?.payload && typeof submission.payload === 'object' && !Array.isArray(submission.payload)
      ? submission.payload
      : {}
  const payloadEntries = Object.entries(payload).filter(([key]) => !DETAIL_SECRET_KEYS.has(String(key)))
  const sourceLabel = SOURCE_LABEL[submission?.source] ?? submission?.source ?? '--'
  const statusLabel = STATUS_LABEL[submission?.status] ?? submission?.status ?? '--'
  const statusText =
    submission?.status && STATUS_BADGE_STYLES[submission.status]
      ? `${statusLabel}`
      : `${statusLabel}`
  const messageText = String(submission?.message ?? '').replace(/\r\n/g, '\n').trim()
  const messageParagraphs = messageText
    ? messageText.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
    : ['--']

  const renderBody = () => {
    if (isLoading) {
      return <p className="text-sm text-slate-600">Loading submission detail...</p>
    }

    if (errorMessage) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )
    }

    if (!submission) {
      return <p className="text-sm text-slate-600">Submission detail is unavailable.</p>
    }

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReadOnlyField label="Submission ID" value={`#${submission.id ?? '--'}`} />
          <ReadOnlyField label="Submitted At" value={formatDateTime(submission.createdAt)} />
          <ReadOnlyField label="Source" value={sourceLabel} />
          <ReadOnlyField label="Status" value={statusText} />
          <ReadOnlyField label="Name" value={submission.name || '--'} />
          <ReadOnlyField label="Email" value={submission.email || '--'} />
          <ReadOnlyField label="Phone" value={submission.phone || '--'} />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Message</p>
          <div className="mt-1 h-56 overflow-y-auto rounded-md border border-slate-300 bg-white px-3 py-3 text-slate-700">
            {messageParagraphs.map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} className="mb-4 whitespace-pre-line text-[15px] leading-7 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Additional Fields</p>
          <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-3">
            {payloadEntries.length === 0 ? (
              <p className="text-sm text-slate-600">No additional payload fields.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {payloadEntries.map(([key, value]) => {
                  const fieldValue = formatDetailValue(value)
                  const isMultiline = fieldValue.length > 80 || fieldValue.includes('\n')
                  return (
                    <ReadOnlyField
                      key={key}
                      label={formatPayloadLabel(key)}
                      value={fieldValue}
                      multiline={isMultiline}
                      rows={isMultiline ? 4 : 3}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Audit Trail</p>
          <div className="mt-1 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white">
            {auditLogs.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-600">No audit records.</p>
            ) : (
              <ul className="divide-y divide-slate-200 text-sm text-slate-700">
                {auditLogs.slice(0, 50).map((log) => (
                  <li key={log.id} className="px-3 py-2">
                    <p className="font-medium text-slate-900">{log.action || '--'}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDateTime(log.createdAt)} by {log.actorId || 'unknown'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[320] flex justify-end bg-slate-900/25"
      onClick={(event) => {
        if (event.target === event.currentTarget) handleRequestClose()
      }}
    >
      <aside
        className={`${isClosing ? 'slide-right-out' : 'slide-right-in'} h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl`}
        style={{ '--anim-distance': '560px', '--anim-duration': '420ms' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Submission Details</h2>
            <p className="mt-1 text-xs text-slate-500">Read-only view. Editing form content is not allowed.</p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            aria-label="Close detail dialog"
          >
            <span className="inline-flex items-center gap-1">
              <XMarkIcon className="h-4 w-4" />
              Close
            </span>
          </button>
        </div>

        <div className="mt-5">{renderBody()}</div>
      </aside>
    </div>,
    document.body,
  )
}

export default SubmissionsInboxPage
