import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const DropdownSelect = ({
  value,
  options = [],
  placeholder = 'Choose here',
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value)
    return selected?.label ?? placeholder
  }, [options, value, placeholder])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (nextValue) => {
    onChange?.(nextValue)
    setIsOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 hover:border-slate-400"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div
          className="fade-down-in absolute z-30 mt-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg"
          style={{ '--anim-distance': '10px', '--anim-duration': '180ms' }}
        >
          <button
            type="button"
            onClick={() => handleSelect('')}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-100 ${
                option.value === value ? 'font-semibold text-slate-900' : 'text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default DropdownSelect
