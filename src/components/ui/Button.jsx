import { cn } from '@/lib/utils'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  ...props
}) {
  const variants = {
    primary: 'bg-electric-blue hover:bg-blue-500 text-white font-semibold shadow-sm',
    secondary: 'bg-slate-medium hover:bg-slate-muted text-text-primary',
    ghost: 'bg-transparent hover:bg-slate-medium text-text-primary',
    danger: 'bg-rose-danger hover:bg-red-600 text-white font-semibold',
    outline: 'border border-border bg-transparent hover:bg-slate-medium text-text-primary',
    success: 'bg-emerald-present hover:bg-green-600 text-white font-semibold',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-11 px-4 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-xl',
    icon: 'h-10 w-10 rounded-xl',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-touch',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

