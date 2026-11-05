import { cn } from '@/lib/utils'

export function Card({ children, className, admin = false, ...props }) {
  return (
    <div
      className={cn(
        'svit-card',
        admin && 'border-l-2 border-l-amber-warning',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

export function CardTitle({ children, className }) {
  return <h3 className={cn('font-semibold text-text-primary text-base', className)}>{children}</h3>
}

export function CardContent({ children, className }) {
  return <div className={cn('', className)}>{children}</div>
}

