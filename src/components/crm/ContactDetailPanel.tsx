import { X, Mail, Phone, Globe, Link2, Calendar, Pencil, Trash2, Flag } from 'lucide-react'
import type { Contact } from '@/types/contacts'
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG } from '@/lib/constants'
import { NotesTimeline } from './NotesTimeline'
import { formatRelativeDate, isOverdue, cn } from '@/lib/utils'

interface ContactDetailPanelProps {
  contact: Contact
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ContactDetailPanel({ contact, onClose, onEdit, onDelete }: ContactDetailPanelProps) {
  const statusConfig = STATUS_CONFIG[contact.status]
  const priorityConfig = PRIORITY_CONFIG[contact.priority]
  const sourceConfig = SOURCE_CONFIG[contact.source]

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[400px] flex-col border-l border-border bg-surface shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg font-semibold text-text-main truncate">{contact.name}</h2>
          {contact.company && (
            <p className="text-[13px] text-text-muted mt-0.5">{contact.company}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 ml-3 shrink-0">
          <button onClick={onEdit} className="rounded-md p-1.5 text-text-dim hover:bg-surface-light hover:text-primary transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="rounded-md p-1.5 text-text-dim hover:bg-danger-muted hover:text-danger transition-colors">
            <Trash2 size={15} />
          </button>
          <button onClick={onClose} className="rounded-md p-1.5 text-text-dim hover:bg-surface-light hover:text-text-main transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {/* Properties grid */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between py-1">
            <span className="text-[12px] text-text-dim w-24 shrink-0">Status</span>
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              statusConfig.bgColor
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dotColor)} />
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[12px] text-text-dim w-24 shrink-0">Priority</span>
            <div className="flex items-center gap-1.5">
              <Flag size={12} fill={priorityConfig.iconColor} color={priorityConfig.iconColor} />
              <span className={cn('text-[12px] font-medium', priorityConfig.color)}>{priorityConfig.label}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[12px] text-text-dim w-24 shrink-0">Bron</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', sourceConfig.bgColor)}>
              {sourceConfig.label}
            </span>
          </div>

          {contact.next_follow_up && (
            <div className="flex items-center justify-between py-1">
              <span className="text-[12px] text-text-dim w-24 shrink-0">Opvolging</span>
              <span className={cn(
                'flex items-center gap-1.5 text-[12px] font-medium',
                isOverdue(contact.next_follow_up) ? 'text-danger' : 'text-text-muted'
              )}>
                <Calendar size={12} />
                {formatRelativeDate(contact.next_follow_up)}
              </span>
            </div>
          )}
        </div>

        <div className="h-px bg-border/50 mb-4" />

        {/* Contact links */}
        <div className="space-y-1 mb-5">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-text-muted hover:bg-surface-light hover:text-primary transition-colors">
              <Mail size={13} className="shrink-0 text-text-dim" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-text-muted hover:bg-surface-light hover:text-primary transition-colors">
              <Phone size={13} className="shrink-0 text-text-dim" />
              {contact.phone}
            </a>
          )}
          {contact.linkedin_url && (
            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-text-muted hover:bg-surface-light hover:text-primary transition-colors">
              <Link2 size={13} className="shrink-0 text-text-dim" />
              LinkedIn
            </a>
          )}
          {contact.website && (
            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-text-muted hover:bg-surface-light hover:text-primary transition-colors">
              <Globe size={13} className="shrink-0 text-text-dim" />
              <span className="truncate">{contact.website}</span>
            </a>
          )}
          {!contact.email && !contact.phone && !contact.linkedin_url && !contact.website && (
            <p className="text-[12px] text-text-dim px-2 py-1">Geen contactgegevens</p>
          )}
        </div>

        <div className="h-px bg-border/50 mb-4" />

        {/* Notes */}
        <NotesTimeline contactId={contact.id} />
      </div>
    </div>
  )
}

