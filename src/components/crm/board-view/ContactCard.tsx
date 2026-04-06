import { useDraggable } from '@dnd-kit/core'
import { Calendar, Flag, Building2 } from 'lucide-react'
import type { Contact } from '@/types/contacts'
import { PRIORITY_CONFIG } from '@/lib/constants'
import { SourceBadge } from '../SourceBadge'
import { formatRelativeDate, isOverdue, cn } from '@/lib/utils'

interface ContactCardProps {
  contact: Contact
  onClick: () => void
  isDragOverlay?: boolean
}

export function ContactCard({ contact, onClick, isDragOverlay }: ContactCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const priorityConfig = PRIORITY_CONFIG[contact.priority]
  const overdue = isOverdue(contact.next_follow_up)

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border border-border/60 bg-surface-light p-3 transition-all hover:border-border-light',
        isDragging && 'opacity-30',
        isDragOverlay && 'rotate-1 border-primary/40 shadow-xl shadow-black/30'
      )}
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-[13px] font-medium text-text-main leading-tight">{contact.name}</p>
        <Flag size={11} fill={priorityConfig.iconColor} color={priorityConfig.iconColor} className="shrink-0 mt-0.5" />
      </div>

      {contact.company && (
        <p className="flex items-center gap-1 text-[11px] text-text-dim mb-2">
          <Building2 size={10} className="shrink-0" />
          {contact.company}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <SourceBadge source={contact.source} />
        {contact.next_follow_up && (
          <span className={cn(
            'flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[10px]',
            overdue ? 'text-danger font-medium' : 'text-text-dim'
          )}>
            <Calendar size={9} />
            {formatRelativeDate(contact.next_follow_up)}
          </span>
        )}
      </div>
    </div>
  )
}
