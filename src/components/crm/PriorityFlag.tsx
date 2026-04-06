import { Flag } from 'lucide-react'
import { PRIORITY_CONFIG, type ContactPriority } from '@/lib/constants'

interface PriorityFlagProps {
  priority: ContactPriority
  size?: number
}

export function PriorityFlag({ priority, size = 14 }: PriorityFlagProps) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <div className="flex items-center gap-1.5" title={config.label}>
      <Flag size={size} fill={config.iconColor} color={config.iconColor} />
      <span className={`text-xs ${config.color}`}>{config.label}</span>
    </div>
  )
}
