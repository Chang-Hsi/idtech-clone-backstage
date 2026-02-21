const RemindDialog = ({
  isOpen,
  title,
  description,
  ackLabel = 'OK',
  onAcknowledge,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="fade-up-in w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
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
    </div>
  )
}

export default RemindDialog
