import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function Select({ label, options = [], value, onChange, placeholder, error, disabled, className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={ref}>
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(o => !o)}
          className={cn(
            'w-full h-11 bg-navy-surface border border-border rounded-xl px-4 text-sm text-left flex items-center justify-between',
            'focus:outline-none focus:border-electric-blue transition-all',
            error && 'border-rose-danger',
            disabled && 'opacity-50 cursor-not-allowed',
            !selected && 'text-text-secondary',
            selected && 'text-text-primary'
          )}
        >
          <span className="truncate">{selected?.label || placeholder || 'Select...'}</span>
          <svg className={cn('w-4 h-4 text-text-secondary transition-transform shrink-0', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-navy-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {options.length === 0 ? (
                <div className="p-3 text-sm text-text-secondary text-center">No options</div>
              ) : options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm text-left hover:bg-slate-medium transition-colors',
                    value === opt.value ? 'text-electric-blue font-medium' : 'text-text-primary'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-danger">{error}</p>}
    </div>
  )
}

