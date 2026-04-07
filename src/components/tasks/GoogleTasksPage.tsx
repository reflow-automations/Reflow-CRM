import { useState, useMemo } from 'react'
import { CheckSquare, Plus, Search, LogOut, Loader2, Eye, EyeOff, ArrowUpDown } from 'lucide-react'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { useTaskLists, useGoogleTasks, useCompleteGoogleTask, useDeleteGoogleTask } from '@/hooks/useGoogleTasks'
import { useAllTaskContactLinks } from '@/hooks/useTaskContactLinks'
import { useContacts } from '@/hooks/useContacts'
import { GoogleTaskRow } from './GoogleTaskRow'
import { GoogleTaskDialog } from './GoogleTaskDialog'
import type { GoogleTask } from '@/types/google-tasks'
import { toast } from 'sonner'

export function GoogleTasksPage() {
  const { isAuthenticated, isLoading: authLoading, signInWithGoogle, signOutGoogle } = useGoogleAuth()
  const { data: taskLists = [], isLoading: listsLoading } = useTaskLists()
  const { data: allLinks = [] } = useAllTaskContactLinks()
  const { data: contacts = [] } = useContacts()

  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortBy, setSortBy] = useState<'position' | 'due'>('position')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<GoogleTask | null>(null)

  // Auto-select first list
  const activeListId = selectedListId || taskLists[0]?.id || null

  const { data: tasks = [], isLoading: tasksLoading } = useGoogleTasks(activeListId)
  const completeTask = useCompleteGoogleTask()
  const deleteTask = useDeleteGoogleTask()

  const contactMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of contacts) map[c.id] = c.name
    return map
  }, [contacts])

  const linkMap = useMemo(() => {
    const map: Record<string, { contactId: string; linkId: string }> = {}
    for (const l of allLinks) {
      map[l.google_task_id] = { contactId: l.contact_id, linkId: l.id }
    }
    return map
  }, [allLinks])

  const filteredTasks = useMemo(() => {
    let list = tasks
    if (!showCompleted) {
      list = list.filter((t) => t.status !== 'completed')
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      )
    }
    // Sort
    list = [...list]
    if (sortBy === 'due') {
      list.sort((a, b) => {
        const aDue = a.due ? new Date(a.due).getTime() : Infinity
        const bDue = b.due ? new Date(b.due).getTime() : Infinity
        return aDue - bDue
      })
    } else {
      // Google Tasks 'position' is a lexicographic string, sort ascending
      list.sort((a, b) => (a.position || '').localeCompare(b.position || ''))
    }
    return list
  }, [tasks, showCompleted, search, sortBy])

  const handleToggle = (task: GoogleTask) => {
    if (!activeListId) return
    completeTask.mutate({
      taskListId: activeListId,
      taskId: task.id,
      completed: task.status !== 'completed',
    })
  }

  const handleDelete = (task: GoogleTask) => {
    if (!activeListId) return
    deleteTask.mutate(
      { taskListId: activeListId, taskId: task.id },
      { onSuccess: () => toast.success('Taak verwijderd') }
    )
  }

  const handleEdit = (task: GoogleTask) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingTask(null)
    setDialogOpen(true)
  }

  // Not authenticated — show connect screen
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-text-main">Google Tasks</h1>
          <p className="text-sm text-text-muted mt-1">Beheer je Google Tasks direct vanuit je CRM</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-light">
            <CheckSquare size={24} className="text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-text-main mb-2">
            Verbind je Google Account
          </h3>
          <p className="text-sm text-text-muted text-center max-w-sm mb-6">
            Koppel je Google-account om je taken te beheren, deadlines bij te houden en taken aan contacten te koppelen.
          </p>
          <button
            onClick={signInWithGoogle}
            disabled={authLoading}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {authLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
            Verbind Google Tasks
          </button>
        </div>
      </div>
    )
  }

  const isLoading = listsLoading || tasksLoading

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-main">Google Tasks</h1>
          <p className="text-sm text-text-muted mt-1">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'taak' : 'taken'}
            {!showCompleted && tasks.filter(t => t.status === 'completed').length > 0 &&
              ` (${tasks.filter(t => t.status === 'completed').length} voltooid verborgen)`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-midnight transition-colors hover:bg-primary-hover"
          >
            <Plus size={15} />
            Nieuwe taak
          </button>
          <button
            onClick={signOutGoogle}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-surface-light transition-colors"
          >
            <LogOut size={14} />
            Ontkoppel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        {taskLists.length > 1 && (
          <select
            value={activeListId || ''}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {taskLists.map((list) => (
              <option key={list.id} value={list.id}>{list.title}</option>
            ))}
          </select>
        )}

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek taken..."
            className="w-full rounded-lg border border-border bg-surface-light pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="relative flex items-center gap-1.5 rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-muted">
          <ArrowUpDown size={13} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'position' | 'due')}
            className="bg-transparent text-sm text-text-muted focus:outline-none cursor-pointer"
          >
            <option value="position">Google volgorde</option>
            <option value="due">Deadline</option>
          </select>
        </div>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-surface-light transition-colors"
        >
          {showCompleted ? <Eye size={14} /> : <EyeOff size={14} />}
          {showCompleted ? 'Verberg voltooide' : 'Toon voltooide'}
        </button>
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-dim">
            <CheckSquare size={32} className="mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'Geen taken gevonden' : 'Geen taken in deze lijst'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredTasks.map((task) => {
              const link = linkMap[task.id]
              const contactName = link ? contactMap[link.contactId] : undefined
              return (
                <GoogleTaskRow
                  key={task.id}
                  task={task}
                  contactName={contactName}
                  onToggle={() => handleToggle(task)}
                  onEdit={() => handleEdit(task)}
                  onDelete={() => handleDelete(task)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      {activeListId && (
        <GoogleTaskDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditingTask(null) }}
          task={editingTask}
          taskListId={activeListId}
        />
      )}
    </div>
  )
}
