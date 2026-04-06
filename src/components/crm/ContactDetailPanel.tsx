import { useState, useRef, useEffect } from 'react'
import { X, Mail, Phone, Globe, Link2, Calendar, Pencil, Trash2, Flag, Euro, Plus, Check } from 'lucide-react'
import type { Contact } from '@/types/contacts'
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG } from '@/lib/constants'
import { NotesTimeline } from './NotesTimeline'
import { useSubtasks, useCreateSubtask, useToggleSubtask, useDeleteSubtask } from '@/hooks/useSubtasks'
import { useTimeTotals } from '@/hooks/useTimeTracking'
import { useTaskContactLinks, useUnlinkTaskFromContact } from '@/hooks/useTaskContactLinks'
import { useGoogleTasks, useCompleteGoogleTask } from '@/hooks/useGoogleTasks'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { GoogleTaskDialog } from '@/components/tasks/GoogleTaskDialog'
import { TimeTracker } from '@/components/shared/TimeTracker'
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
  const { data: subtasks = [] } = useSubtasks(contact.id)
  const createSubtask = useCreateSubtask()
  const toggleSubtask = useToggleSubtask()
  const deleteSubtask = useDeleteSubtask()
  const { data: timeTotals = {} } = useTimeTotals()
  const contactMinutes = timeTotals[contact.id] || 0
  const { isAuthenticated } = useGoogleAuth()
  const { data: taskLinks = [] } = useTaskContactLinks(contact.id)
  const firstLink = taskLinks[0]
  const taskListId = firstLink?.google_task_list_id || null
  const { data: googleTasks = [] } = useGoogleTasks(taskListId)
  const completeGoogleTask = useCompleteGoogleTask()
  const unlinkTask = useUnlinkTaskFromContact()
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [newSubtaskName, setNewSubtaskName] = useState('')
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingSubtask && subtaskInputRef.current) subtaskInputRef.current.focus()
  }, [addingSubtask])

  const handleCreateSubtask = () => {
    const name = newSubtaskName.trim()
    if (!name) { setAddingSubtask(false); return }
    createSubtask.mutate({ contactId: contact.id, name })
    setNewSubtaskName('')
  }

  const formatEuro = (value: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

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

          {contact.deal_value != null && (
            <div className="flex items-center justify-between py-1">
              <span className="text-[12px] text-text-dim w-24 shrink-0">Dealwaarde</span>
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-green-400">
                <Euro size={12} />
                {formatEuro(contact.deal_value)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <span className="text-[12px] text-text-dim w-24 shrink-0">Tijd</span>
            <TimeTracker contactId={contact.id} totalMinutes={contactMinutes} />
          </div>

          {contact.notes && (
            <div className="flex items-start justify-between py-1 gap-3">
              <span className="text-[12px] text-text-dim w-24 shrink-0 mt-0.5">Notitie</span>
              <span className="text-[12px] text-text-muted text-right leading-relaxed">{contact.notes}</span>
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

        {/* Subtasks */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
              Subtasks {subtasks.length > 0 && `(${subtasks.filter(s => s.completed).length}/${subtasks.length})`}
            </h4>
            <button
              onClick={() => setAddingSubtask(true)}
              className="text-text-dim hover:text-primary transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {subtasks.map((subtask) => (
              <div key={subtask.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-light/60 transition-colors">
                <button
                  onClick={() => toggleSubtask.mutate({ id: subtask.id, completed: !subtask.completed })}
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    subtask.completed
                      ? 'border-primary bg-primary text-midnight'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {subtask.completed && <Check size={10} />}
                </button>
                <span className={cn(
                  'flex-1 text-[12px]',
                  subtask.completed ? 'line-through text-text-dim' : 'text-text-muted'
                )}>
                  {subtask.name}
                </span>
                <button
                  onClick={() => deleteSubtask.mutate(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}

            {addingSubtask && (
              <div className="px-2 py-1">
                <input
                  ref={subtaskInputRef}
                  value={newSubtaskName}
                  onChange={(e) => setNewSubtaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSubtask()
                    if (e.key === 'Escape') { setNewSubtaskName(''); setAddingSubtask(false) }
                  }}
                  onBlur={handleCreateSubtask}
                  placeholder="Subtask naam..."
                  className="w-full bg-transparent border-b border-primary/40 outline-none text-[12px] text-text-muted py-0.5 placeholder:text-text-dim"
                />
              </div>
            )}

            {subtasks.length === 0 && !addingSubtask && (
              <p className="text-[11px] text-text-dim px-2 py-1">Geen subtasks</p>
            )}
          </div>
        </div>

        <div className="h-px bg-border/50 mb-4" />

        {/* Google Tasks */}
        {isAuthenticated && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                Google Tasks {taskLinks.length > 0 && `(${taskLinks.length})`}
              </h4>
              <button
                onClick={() => setTaskDialogOpen(true)}
                className="text-text-dim hover:text-primary transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-0.5">
              {taskLinks.map((link) => {
                const task = googleTasks.find((t) => t.id === link.google_task_id)
                if (!task) return null
                const isCompleted = task.status === 'completed'
                return (
                  <div key={link.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-light/60 transition-colors">
                    <button
                      onClick={() => taskListId && completeGoogleTask.mutate({
                        taskListId,
                        taskId: task.id,
                        completed: !isCompleted,
                      })}
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isCompleted
                          ? 'border-primary bg-primary text-midnight'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {isCompleted && <Check size={10} />}
                    </button>
                    <span className={cn(
                      'flex-1 text-[12px] truncate',
                      isCompleted ? 'line-through text-text-dim' : 'text-text-muted'
                    )}>
                      {task.title}
                    </span>
                    {task.due && (
                      <span className={cn(
                        'text-[10px] shrink-0',
                        isOverdue(task.due.split('T')[0]) && !isCompleted ? 'text-danger' : 'text-text-dim'
                      )}>
                        {formatRelativeDate(task.due.split('T')[0])}
                      </span>
                    )}
                    <button
                      onClick={() => unlinkTask.mutate(link.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-all"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )
              })}

              {taskLinks.length === 0 && (
                <p className="text-[11px] text-text-dim px-2 py-1">Geen gekoppelde taken</p>
              )}
            </div>

            <GoogleTaskDialog
              open={taskDialogOpen}
              onClose={() => setTaskDialogOpen(false)}
              taskListId={taskListId || '@default'}
              existingContactId={contact.id}
            />
          </div>
        )}

        {isAuthenticated && <div className="h-px bg-border/50 mb-4" />}

        {/* Notes */}
        <NotesTimeline contactId={contact.id} />
      </div>
    </div>
  )
}

