import { useId } from 'react'

const FloatingLabelInput = ({
  id,
  label,
  value,
  onValueChange,
  type = 'text',
  min,
  disabled = false,
  className = '',
  inputClassName = '',
  labelClassName = '',
}) => {
  const fallbackId = useId()
  const inputId = id || `floating-input-${fallbackId}`

  return (
    <div className={`relative rounded-lg border border-slate-200 bg-white px-2 py-2 ${className}`.trim()}>
      <input
        id={inputId}
        type={type}
        min={min}
        value={value}
        placeholder=" "
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value, event)}
        className={`peer h-12 w-full rounded-md border border-slate-300 bg-white px-3 pb-2 pt-6 text-slate-900 outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${inputClassName}`.trim()}
      />
      <label
        htmlFor={inputId}
        className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base text-slate-500 transition-all duration-150 peer-focus:top-5 peer-focus:text-xs peer-focus:text-slate-600 peer-not-placeholder-shown:top-5 peer-not-placeholder-shown:text-xs ${labelClassName}`.trim()}
      >
        {label}
      </label>
    </div>
  )
}

export default FloatingLabelInput
