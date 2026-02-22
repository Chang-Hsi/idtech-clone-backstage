const DashboardHeader = ({ userDisplayName }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Hello, {userDisplayName || 'Manager'}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Operational overview for content quality, employee distribution, and account activity.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardHeader
