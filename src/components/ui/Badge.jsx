import { cn } from '@/lib/utils'

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-slate-medium text-text-secondary',
    primary: 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30',
    success: 'bg-emerald-present/20 text-emerald-present border border-emerald-present/30',
    warning: 'bg-amber-warning/20 text-amber-warning border border-amber-warning/30',
    danger: 'bg-rose-danger/20 text-rose-danger border border-rose-danger/30',
    urgent: 'bg-rose-danger text-white',
    theory: 'bg-electric-blue/15 text-electric-blue',
    lab: 'bg-accent/15 text-accent',
    regular: 'bg-slate-medium text-text-secondary',
    le: 'bg-amber-warning/20 text-amber-warning',
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant] || variants.default,
      className
    )}>
      {children}
    </span>
  )
}

