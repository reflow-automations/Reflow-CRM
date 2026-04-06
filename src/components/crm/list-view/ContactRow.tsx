import { Flag, ChevronRight, ChevronDown } from 'lucide-react'
import type { Contact } from '@/types/contacts'
import { PRIORITY_CONFIG, SOURCE_CONFIG, STATUS_CONFIG, STATUS_ORDER, type ContactPriority, type ContactSource, type ContactStatus } from '@/lib/constants'
import { useUpdateContact } from '@/hooks/useContacts'
import { InlineText } from '@/components/shared/InlineText'
import { InlineTextarea } from '@/components/shared/InlineTextarea'
import { InlineSelect } from '@/components/shared/InlineSelect'
import { InlineDate } from '@/components/shared/InlineDate'
import { TimeTracker } from '@/components/shared/TimeTracker'
import { cn } from '@/lib/utils'

interface ContactRowProps {
  contact: Contact
  onClick: () => void
  subtaskCount?: { total: number; done: number }
  expanded: boolean
  onToggleExpand: () => void
  totalMinutes: number
}

const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.label,
  dotColor: key === 'high' ? 'bg-red-500' : key === 'normal' ? 'bg-blue-500' : 'bg-gray-500',
}))

const SOURCE_OPTIONS = Object.entries(SOURCE_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.label,
  bgColor: config.bgColor,
}))

const STATUS_OPTIONS = STATUS_ORDER.map(key => ({
  value: key,
  label: STATUS_CONFIG[key].label,
  dotColor: STATUS_CONFIG[key].dotColor,
}))

export function ContactRow({ contact, onClick, subtaskCount, expanded, onToggleExpand, totalMinutes }: ContactRowProps) {
  const priorityConfig = PRIORITY_CONFIG[contact.priority]
  const updateContact = useUpdateContact()

  const handleUpdate = (field: string, value: string | null) => {
    updateContact.mutate({ id: contact.id, [field]: value } as Parameters<typeof updateContact.mutate>[0])
  }

  const hasSubtasks = subtaskCount && subtaskCount.total > 0

  return (
    <tr className="group border-b border-border/20 transition-colors hover:bg-surface-light/40">
      {/* Name with expand arrow */}
      <td className="py-2.5 pl-4 pr-4 whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-1">
          {/* Status dot */}
          <InlineSelect
            value={contact.status}
            options={STATUS_OPTIONS}
            onSave={(v) => handleUpdate('status', v)}
            renderValue={
              <span className={cn('inline-block w-2.5 h-2.5 rounded-full shrink-0', STATUS_CONFIG[contact.status].dotColor)} />
            }
          />
          {/* Expand arrow for subtasks */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
            className={cn(
              'shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors',
              hasSubtasks
                ? 'text-text-dim hover:text-text-muted hover:bg-surface-light'
                : 'text-transparent group-hover:text-text-dim'
            )}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          <InlineText
            value={contact.name}
            onSave={(v) => handleUpdate('name', v)}
            className="text-[13px] font-medium text-text-main"
          />
          {hasSubtasks && (
            <span className="text-[10px] text-text-dim ml-1 shrink-0">
              {subtaskCount.done}/{subtaskCount.total}
            </span>
          )}
        </div>
      </td>

      {/* Company */}
      <td className="px-4 py-2.5 whitespace-nowrap overflow-hidden">
        <InlineText
          value={contact.company || ''}
          onSave={(v) => handleUpdate('company', v || null)}
          className="text-[13px] text-text-muted"
          placeholder="—"
        />
      </td>

      {/* Notes */}
      <td className="px-4 py-2.5 overflow-hidden">
        <InlineTextarea
          value={contact.notes || ''}
          onSave={(v) => handleUpdate('notes', v || null)}
          className={cn('text-[12px]', contact.notes ? 'text-text-muted' : 'text-text-dim')}
          placeholder="Klik om notitie toe te voegen..."
        />
      </td>

      {/* Time */}
      <td className="px-4 py-2.5 whitespace-nowrap overflow-hidden">
        <TimeTracker
          contactId={contact.id}
          totalMinutes={totalMinutes}
        />
      </td>

      {/* Next follow-up */}
      <td className="px-4 py-2.5 whitespace-nowrap overflow-hidden">
        <InlineDate
          value={contact.next_follow_up}
          onSave={(v) => handleUpdate('next_follow_up', v)}
        />
      </td>

      {/* Priority */}
      <td className="px-4 py-2.5 whitespace-nowrap overflow-hidden">
        <InlineSelect
          value={contact.priority}
          options={PRIORITY_OPTIONS}
          onSave={(v) => handleUpdate('priority', v)}
          renderValue={
            <div className="flex items-center gap-1.5">
              <Flag size={12} fill={priorityConfig.iconColor} color={priorityConfig.iconColor} />
              <span className={cn('text-[12px]', priorityConfig.color)}>{priorityConfig.label}</span>
            </div>
          }
        />
      </td>

      {/* Source */}
      <td className="px-4 py-2.5 whitespace-nowrap overflow-hidden">
        <InlineSelect
          value={contact.source}
          options={SOURCE_OPTIONS}
          onSave={(v) => handleUpdate('source', v)}
          renderValue={
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium', SOURCE_CONFIG[contact.source].bgColor)}>
              {SOURCE_CONFIG[contact.source].label}
            </span>
          }
        />
      </td>

      {/* Email */}
      <td className="px-4 py-2.5 whitespace-nowrap overflow-hidden">
        <InlineText
          value={contact.email || ''}
          onSave={(v) => handleUpdate('email', v || null)}
          className="text-[12px] text-text-dim"
          placeholder="—"
        />
      </td>
    </tr>
  )
}
