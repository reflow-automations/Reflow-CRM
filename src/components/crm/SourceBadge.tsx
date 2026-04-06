import { SOURCE_CONFIG, type ContactSource } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SourceBadgeProps {
  source: ContactSource
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source]
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium', config.bgColor)}>
      {config.label}
    </span>
  )
}
