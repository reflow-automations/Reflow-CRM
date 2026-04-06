import { STATUS_CONFIG, type ContactStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: ContactStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide',
        size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]',
        config.bgColor
      )}
    >
      <span className={cn('rounded-full', config.dotColor, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {config.label}
    </span>
  )
}
