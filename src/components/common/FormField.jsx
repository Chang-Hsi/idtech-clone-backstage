const FormField = ({ label, required = false, error = '', className = '', children }) => {
  return (
    <label className={`space-y-1 text-sm ${className}`.trim()}>
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </label>
  )
}

export default FormField
