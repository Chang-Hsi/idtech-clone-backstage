import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const DEFAULT_ROWS_OPTIONS = [10, 20, 50]

const Pagination = ({
  totalCount = 0,
  limit = 10,
  offset = 0,
  rowsPerPageOptions = DEFAULT_ROWS_OPTIONS,
  onPageChange,
  onLimitChange,
}) => {
  const safeLimit = limit > 0 ? limit : 10
  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit))
  const currentPage = Math.floor(offset / safeLimit) + 1

  const createPageWindow = () => {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + 4)
    const normalizedStart = Math.max(1, end - 4)
    const pages = []
    for (let page = normalizedStart; page <= end; page += 1) pages.push(page)
    return pages
  }

  const pageWindow = createPageWindow()

  const goToPage = (page) => {
    if (!onPageChange) return
    const clamped = Math.max(1, Math.min(totalPages, page))
    if (clamped === currentPage) return
    onPageChange(clamped)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-3">
      <button
        type="button"
        onClick={() => goToPage(1)}
        disabled={currentPage <= 1}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
      >
        <ChevronDoubleLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      {pageWindow.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => goToPage(page)}
          className={`h-10 w-10 rounded-full text-sm font-medium transition ${
            page === currentPage
              ? 'bg-[#020C2A] text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => goToPage(totalPages)}
        disabled={currentPage >= totalPages}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
      >
        <ChevronDoubleRightIcon className="h-4 w-4" />
      </button>

      <select
        value={safeLimit}
        onChange={(event) => onLimitChange?.(Number(event.target.value))}
        className="ml-2 h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
      >
        {rowsPerPageOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Pagination
