import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline'

const CredentialsDialog = ({
  isOpen,
  title,
  description,
  credentials,
  copiedKey,
  onCopy,
  onCopyAll,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined
    const frameId = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('ui:close-popovers'))
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/55 p-4">
      <div className="fade-up-in z-[301] w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            aria-label="Close issued credentials dialog"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Temporary Password</th>
                <th className="w-[140px] px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((item) => {
                const rowKey = `${item.employeeId}:${item.email}`
                return (
                  <tr key={rowKey} className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-700">{item.email}</td>
                    <td className="px-3 py-2 font-mono text-slate-900">{item.temporaryPassword}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onCopy(item.temporaryPassword, rowKey)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                        {copiedKey === rowKey ? 'Copied' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCopyAll}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            Copy All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CredentialsDialog
