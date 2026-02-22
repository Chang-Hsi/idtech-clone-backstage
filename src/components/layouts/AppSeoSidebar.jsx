import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchBackstageSeoTargets } from '../../api/backstageSeoApi'
import DropdownSelect from '../common/DropdownSelect'
import ConfirmDialog from '../dialog/ConfirmDialog'

const SOURCE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'explicit', label: 'Explicit' },
  { value: 'fallback', label: 'Fallback' },
  { value: 'noindex', label: 'Noindex' },
]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'page', label: 'page' },
  { value: 'product', label: 'product' },
  { value: 'collection', label: 'collection' },
  { value: 'use-case', label: 'use-case' },
  { value: 'resource', label: 'resource' },
  { value: 'career', label: 'career' },
]

const PAGE_SIZE = 80

const AppSeoSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const selectedTargetKey = searchParams.get('target') ?? ''
  const isScoreRecordsRoute = location.pathname.startsWith('/seo/score-records')

  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [targets, setTargets] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingTargetKey, setPendingTargetKey] = useState('')
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)

  const load = async ({ nextOffset = 0, append = false } = {}) => {
      setStatus('loading')
      setErrorMessage('')
      try {
        const payload = await fetchBackstageSeoTargets({
          q: query,
          source: sourceFilter,
          type: typeFilter,
          limit: PAGE_SIZE,
          offset: nextOffset,
        })
        const list = Array.isArray(payload?.data?.targets) ? payload.data.targets : []
        const responseTotal = Number(payload?.data?.total ?? list.length)
        const responseOffset = Number(payload?.data?.offset ?? nextOffset)
        setTargets((prev) => {
          if (!append) return list
          const merged = [...prev, ...list]
          const byKey = new Map(merged.map((item) => [item.targetKey, item]))
          return Array.from(byKey.values())
        })
        setTotal(responseTotal)
        setOffset(responseOffset)
        setStatus('success')
      } catch (error) {
        setStatus('error')
        setErrorMessage(error?.message || 'Unable to load SEO targets.')
      }
    }

  useEffect(() => {
    load({ nextOffset: 0, append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sourceFilter, typeFilter])

  useEffect(() => {
    const handleRefresh = () => load({ nextOffset: 0, append: false })
    window.addEventListener('seo-targets:refresh', handleRefresh)
    return () => window.removeEventListener('seo-targets:refresh', handleRefresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sourceFilter, typeFilter])

  useEffect(() => {
    const handleDirtyChange = (event) => {
      const next = Boolean(event?.detail?.isDirty)
      setHasUnsavedChanges(next)
    }
    window.addEventListener('seo-editor:dirty-change', handleDirtyChange)
    return () => window.removeEventListener('seo-editor:dirty-change', handleDirtyChange)
  }, [])

  useEffect(() => {
    if (isScoreRecordsRoute) return
    if (status !== 'success') return
    if (targets.length === 0) return
    if (selectedTargetKey && targets.some((item) => item.targetKey === selectedTargetKey)) return

    const params = new URLSearchParams(searchParams)
    params.set('target', targets[0].targetKey)
    navigate(`/seo?${params.toString()}`, { replace: true })
  }, [isScoreRecordsRoute, navigate, searchParams, selectedTargetKey, status, targets])

  const groupedTargets = useMemo(() => {
    const pageItems = targets.filter((item) => item.entityType === 'page')
    const detailItems = targets.filter((item) => item.entityType !== 'page')
    return [
      { title: 'Page Types', items: pageItems },
      { title: 'Detail Types', items: detailItems },
    ]
  }, [targets])

  const navigateToTarget = (targetKey) => {
    if (!targetKey) return
    const params = new URLSearchParams(searchParams)
    params.set('target', targetKey)
    navigate(`/seo?${params.toString()}`)
  }

  const selectTarget = (targetKey) => {
    if (!targetKey || targetKey === selectedTargetKey) return
    if (hasUnsavedChanges) {
      setPendingTargetKey(targetKey)
      setIsLeaveConfirmOpen(true)
      return
    }
    navigateToTarget(targetKey)
  }

  return (
    <aside className="fixed inset-y-0 left-18 hidden w-72 border-r border-slate-300 bg-slate-100 md:block">
      <div className="border-b border-slate-300 px-6 py-5">
        <h2 className="text-2xl font-semibold text-slate-800">SEO Targets</h2>
      </div>

      <div className="h-[calc(100vh-88px)] space-y-5 overflow-y-auto p-5">
        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => navigate('/seo/score-records')}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
              isScoreRecordsRoute
                ? 'bg-indigo-100 font-medium text-indigo-700'
                : 'text-slate-700 hover:bg-white hover:text-slate-900'
            }`}
          >
            Score Records
          </button>
          <button
            type="button"
            onClick={() => navigate('/seo')}
            className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
              !isScoreRecordsRoute
                ? 'bg-indigo-100 font-medium text-indigo-700'
                : 'text-slate-700 hover:bg-white hover:text-slate-900'
            }`}
          >
            SEO Targets
          </button>
        </nav>

        {!isScoreRecordsRoute ? (
        <div className="space-y-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search targets"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-500"
            />
          </div>

          <DropdownSelect
            value={sourceFilter}
            options={SOURCE_FILTER_OPTIONS}
            onChange={(nextValue) => setSourceFilter(nextValue || 'all')}
            placeholder="Source filter"
          />
          <DropdownSelect
            value={typeFilter}
            options={TYPE_FILTER_OPTIONS}
            onChange={(nextValue) => setTypeFilter(nextValue || 'all')}
            placeholder="Type filter"
          />
        </div>
        ) : null}

        {!isScoreRecordsRoute && status === 'error' ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{errorMessage}</div>
        ) : null}

        {!isScoreRecordsRoute ? groupedTargets.map((group) => (
          <section key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title}</h3>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.targetKey === selectedTargetKey
                return (
                  <button
                    key={item.targetKey}
                    type="button"
                    onClick={() => selectTarget(item.targetKey)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'bg-indigo-100 font-medium text-indigo-700'
                        : 'text-slate-700 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{item.displayName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          item.sourceState === 'explicit'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.sourceState === 'explicit' ? 'E' : 'F'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{item.targetKey}</p>
                  </button>
                )
              })}
              {group.items.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400">No items.</p>
              ) : null}
            </nav>
          </section>
        )) : null}

        {!isScoreRecordsRoute && targets.length < total ? (
          <button
            type="button"
            onClick={() => load({ nextOffset: offset + PAGE_SIZE, append: true })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            Load More
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={isLeaveConfirmOpen}
        title="Discard Unsaved Changes?"
        description="You have unsaved SEO changes. Switch target and discard current edits?"
        confirmLabel="Discard"
        onConfirm={() => {
          setIsLeaveConfirmOpen(false)
          if (pendingTargetKey) navigateToTarget(pendingTargetKey)
          setPendingTargetKey('')
        }}
        onCancel={() => {
          setIsLeaveConfirmOpen(false)
          setPendingTargetKey('')
        }}
      />
    </aside>
  )
}

export default AppSeoSidebar
