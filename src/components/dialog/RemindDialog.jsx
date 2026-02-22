import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const RemindDialog = ({
  isOpen,
  title,
  description,
  ackLabel = 'OK',
  onAcknowledge,
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
      <div className="fade-up-in z-[301] w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>

        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={onAcknowledge}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {ackLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default RemindDialog
