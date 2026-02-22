const SettingsAuditSection = ({ auditLogs, formatDateTime }) => {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Audit Logs</h2>
      <div className="space-y-2">
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit logs yet.</p>
        ) : (
          auditLogs.map((log) => (
            <div key={log.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-900">{log.action}</p>
              <p className="mt-1 text-xs text-slate-600">
                {formatDateTime(log.createdAt)} | actor: {log.actorId || '-'} | target: {log.targetType}:{log.targetId}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default SettingsAuditSection
