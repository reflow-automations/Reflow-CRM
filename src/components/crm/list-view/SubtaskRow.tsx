import { Square, CheckSquare, Trash2 } from 'lucide-react'
import type { Subtask } from '@/types/contacts'
import { useToggleSubtask, useUpdateSubtask, useDeleteSubtask } from '@/hooks/useSubtasks'
import { InlineText } from '@/components/shared/InlineText'
import { TimeTracker } from '@/components/shared/TimeTracker'
import { cn } from '@/lib/utils'

interface SubtaskRowProps {
  subtask: Subtask
  columnCount: number
  totalMinutes: number
}

export function SubtaskRow({ subtask, columnCount, totalMinutes }: SubtaskRowProps) {
  const toggle = useToggleSubtask()
  const update = useUpdateSubtask()
  const remove = useDeleteSubtask()

  // columnCount is 8: Name, Company, Notes, Time, Next Follow-up, Priority, Source, Email
  // SubtaskRow uses colSpan={2} for first 2 cols, then needs individual cells for rest
  const remainingAfterTime = columnCount - 4 // cells after Time column (Next Follow-up, Priority, Source, Email)

  return (
    <tr className="group/sub border-b border-border/10 hover:bg-surface-light/30 transition-colors">
      {/* Checkbox + Name (spans first 2 columns: Name + Company) */}
      <td colSpan={2} className="py-1.5 pl-16 pr-4 overflow-hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggle.mutate({ id: subtask.id, completed: !subtask.completed })
            }}
            className={cn(
              'shrink-0 transition-colors',
              subtask.completed ? 'text-primary' : 'text-text-dim hover:text-text-muted'
            )}
          >
            {subtask.completed ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
          <InlineText
            value={subtask.name}
            onSave={(v) => update.mutate({ id: subtask.id, name: v })}
            className={cn(
              'text-[12px]',
              subtask.completed ? 'line-through text-text-dim' : 'text-text-muted'
            )}
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              remove.mutate(subtask.id)
            }}
            className="opacity-0 group-hover/sub:opacity-100 shrink-0 text-text-dim hover:text-danger transition-all ml-auto"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>

      {/* Notes column - empty */}
      <td className="py-1.5" />

      {/* Time column - with TimeTracker */}
      <td className="px-4 py-1.5 whitespace-nowrap overflow-hidden">
        <TimeTracker
          contactId={subtask.contact_id}
          subtaskId={subtask.id}
          totalMinutes={totalMinutes}
        />
      </td>

      {/* Remaining empty cells */}
      {Array.from({ length: remainingAfterTime }).map((_, i) => (
        <td key={i} className="py-1.5" />
      ))}
    </tr>
  )
}
