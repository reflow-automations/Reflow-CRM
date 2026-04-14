import { Check, Pencil, Trash2, Link2 } from 'lucide-react'
import type { GoogleTask } from '@/types/google-tasks'
import { formatRelativeDate, isOverdue, isDueToday, cn } from '@/lib/utils'

interface GoogleTaskRowProps {
  task: GoogleTask
  contactName?: string
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function GoogleTaskRow({ task, contactName, onToggle, onEdit, onDelete }: GoogleTaskRowProps) {
  const isCompleted = task.status === 'completed'
  const dueDate = task.due ? task.due.split('T')[0] : null

  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-light/60 transition-colors">
      <button
        onClick={onToggle}
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors',
          isCompleted
            ? 'border-primary bg-primary text-midnight'
            : 'border-border hover:border-primary/50'
        )}
      >
        {isCompleted && <Check size={11} />}
      </button>

      <div className="flex-1 min-w-0">
        <span className={cn(
          'block text-[13px] leading-tight truncate',
          isCompleted ? 'line-through text-text-dim' : 'text-text-main'
        )}>
          {task.title}
        </span>
        {task.notes && (
          <span className="block text-[11px] text-text-dim truncate mt-0.5">{task.notes}</span>
        )}
      </div>

      {contactName && (
        <span className="flex items-center gap-1 shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
          <Link2 size={10} />
          {contactName}
        </span>
      )}

      {dueDate && (
        <span className={cn(
          'shrink-0 text-[11px] font-medium',
          isOverdue(dueDate) && !isCompleted ? 'text-danger' :
          isDueToday(dueDate) && !isCompleted ? 'text-yellow-400' : 'text-text-dim'
        )}>
          {formatRelativeDate(dueDate)}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="rounded p-1 text-text-dim hover:text-primary transition-colors">
          <Pencil size={12} />
        </button>
        <button onClick={onDelete} className="rounded p-1 text-text-dim hover:text-danger transition-colors">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
