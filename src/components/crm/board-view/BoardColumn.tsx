import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { STATUS_CONFIG, type ContactStatus } from '@/lib/constants'
import type { Contact } from '@/types/contacts'
import { ContactCard } from './ContactCard'
import { cn } from '@/lib/utils'

interface BoardColumnProps {
  status: ContactStatus
  contacts: Contact[]
  onContactClick: (contact: Contact) => void
  onAddContact: (status: ContactStatus) => void
}

export function BoardColumn({ status, contacts, onContactClick, onAddContact }: BoardColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status })
  const config = STATUS_CONFIG[status]

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border transition-colors',
        isOver
          ? 'border-primary/50 bg-primary/5'
          : 'border-border bg-surface/50'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', config.dotColor)} />
          <span className={cn('text-sm font-semibold uppercase tracking-wider', config.color)}>
            {config.label}
          </span>
          <span className="rounded-full bg-surface-light px-2 py-0.5 text-xs text-text-dim">
            {contacts.length}
          </span>
        </div>
        <button
          onClick={() => onAddContact(status)}
          className="rounded-md p-1 text-text-dim hover:bg-surface-light hover:text-primary"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 p-3 min-h-[120px]">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onClick={() => onContactClick(contact)}
          />
        ))}
        {contacts.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <span className="text-xs text-text-dim">Geen contacten</span>
          </div>
        )}
      </div>
    </div>
  )
}
