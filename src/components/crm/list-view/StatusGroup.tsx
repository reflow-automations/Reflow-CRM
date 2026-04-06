import { useState, Fragment } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { STATUS_CONFIG, type ContactStatus } from '@/lib/constants'
import type { Contact } from '@/types/contacts'
import { ContactRow } from './ContactRow'
import { SubtaskList } from './SubtaskList'
import { cn } from '@/lib/utils'

interface StatusGroupProps {
  status: ContactStatus
  contacts: Contact[]
  onContactClick: (contact: Contact) => void
  onAddContact: (status: ContactStatus) => void
  columnCount: number
  subtaskCounts: Record<string, { total: number; done: number }>
  timeTotals: Record<string, number>
}

export function StatusGroup({ status, contacts, onContactClick, onAddContact, columnCount, subtaskCounts, timeTotals }: StatusGroupProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set())
  const config = STATUS_CONFIG[status]

  const toggleExpand = (contactId: string) => {
    setExpandedContacts(prev => {
      const next = new Set(prev)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return next
    })
  }

  return (
    <tbody>
      {/* Group header row */}
      <tr
        className="cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <td
          colSpan={columnCount}
          className="py-3 bg-midnight/95"
          style={{ position: 'sticky', top: 0, zIndex: 10 }}
        >
          <div className="flex items-center gap-3 pl-2">
            <button className="text-text-dim hover:text-text-main transition-colors">
              {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
            </button>

            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider',
              config.bgColor
            )}>
              <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
              {config.label}
            </span>

            <span className="text-[12px] font-medium text-text-dim">
              {contacts.length}
            </span>

            <div className="flex-1" />

            <button
              onClick={(e) => { e.stopPropagation(); onAddContact(status) }}
              className="rounded-md p-1.5 text-text-dim hover:bg-surface-light hover:text-primary transition-colors mr-2"
            >
              <Plus size={15} />
            </button>
          </div>
        </td>
      </tr>

      {/* Contact rows with inline subtasks */}
      {!collapsed && contacts.map((contact) => {
        const isExpanded = expandedContacts.has(contact.id)
        const stCount = subtaskCounts[contact.id]
        return (
          <Fragment key={contact.id}>
            <ContactRow
              contact={contact}
              onClick={() => onContactClick(contact)}
              subtaskCount={stCount}
              expanded={isExpanded}
              onToggleExpand={() => toggleExpand(contact.id)}
              totalMinutes={timeTotals[contact.id] || 0}
            />
            {isExpanded && (
              <SubtaskList contactId={contact.id} columnCount={columnCount} />
            )}
          </Fragment>
        )
      })}

      {/* Add task row */}
      {!collapsed && (
        <tr>
          <td colSpan={columnCount} className="py-0">
            <button
              onClick={() => onAddContact(status)}
              className="flex w-full items-center gap-2 pl-10 py-2.5 text-[12px] text-text-dim hover:text-primary transition-colors"
            >
              <Plus size={13} />
              Add Task
            </button>
          </td>
        </tr>
      )}

      {/* Bottom spacer */}
      <tr>
        <td colSpan={columnCount} className="h-3" />
      </tr>
    </tbody>
  )
}
