import { useState, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

export function Toaster() {
  const [toasts, setToasts] = useState([])

  function addToast({ title, description, variant = 'default', duration = 3500 }) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, title, description, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  // Expose addToast globally
  if (typeof window !== 'undefined') {
    window.__svitToast = addToast
  }

  const icons = {
    default: <Info className="w-4 h-4 text-electric-blue" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-present" />,
    destructive: <AlertCircle className="w-4 h-4 text-rose-danger" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-warning" />,
  }

  const borders = {
    default: 'border-electric-blue/40',
    success: 'border-emerald-present/40',
    destructive: 'border-rose-danger/40',
    warning: 'border-amber-warning/40',
  }

  return (
    <ToastContext.Provider value={addToast}>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 bg-navy-surface border rounded-xl p-3 shadow-lg pointer-events-auto animate-slide-up',
              borders[toast.variant] || borders.default
            )}
          >
            <div className="mt-0.5 shrink-0">{icons[toast.variant] || icons.default}</div>
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-sm font-semibold text-text-primary">{toast.title}</p>}
              {toast.description && <p className="text-xs text-text-secondary mt-0.5">{toast.description}</p>}
            </div>
            <button
              className="shrink-0 text-text-secondary hover:text-text-primary touch-target"
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Global toast trigger
export function toast(options) {
  if (typeof window !== 'undefined' && window.__svitToast) {
    window.__svitToast(options)
  }
}

