import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

const toYmd = (date) => {
  if (!(date instanceof Date)) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseYmd = (value) => {
  const normalized = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined
  const parsed = new Date(`${normalized}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const DatePickerField = ({ value, onChange, onBlur, placeholder = 'YYYY-MM-DD', disabled = false }) => {
  const rootRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const selectedDate = useMemo(() => parseYmd(value), [value])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
        onBlur?.()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, onBlur])

  const handleSelect = (date) => {
    const nextValue = date ? toYmd(date) : ''
    onChange?.(nextValue)
    setIsOpen(false)
    onBlur?.()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          setIsOpen((prev) => !prev)
        }}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm outline-none focus:border-indigo-500 ${
          disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'text-slate-700'
        }`}
      >
        <span className={value ? 'text-slate-700' : 'text-slate-400'}>{value || placeholder}</span>
        <CalendarDaysIcon className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen ? (
        <div className="fade-down-in absolute z-40 mt-1 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            weekStartsOn={1}
            showOutsideDays
            captionLayout="dropdown"
            fromYear={2000}
            toYear={new Date().getFullYear() + 5}
          />
        </div>
      ) : null}
    </div>
  )
}

export default DatePickerField
