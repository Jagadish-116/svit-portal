import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input({
  label,
  error,
  hint,
  className,
  containerClassName,
  leftIcon,
  rightElement,
  ...props
}, ref) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-11 bg-navy-surface border border-border rounded-xl px-4 text-sm text-text-primary placeholder:text-text-secondary',
            'focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue/30',
            'transition-all duration-150',
            leftIcon && 'pl-10',
            rightElement && 'pr-10',
            error && 'border-rose-danger focus:border-rose-danger focus:ring-rose-danger/30',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
})

