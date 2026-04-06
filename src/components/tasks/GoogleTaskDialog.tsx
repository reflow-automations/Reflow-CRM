import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { GoogleTask, GoogleTaskFormData } from '@/types/google-tasks'
import { useContacts } from '@/hooks/useContacts'
import { useCreateGoogleTask, useUpdateGoogleTask } from '@/hooks/useGoogleTasks'
import { useLinkTaskToContact, useUnlinkTaskFromContact, useAllTaskContactLinks } from '@/hooks/useTaskContactLinks'
import { toast } from 'sonner'

interface GoogleTaskDialogProps {
  open: boolean
  onClose: () => void
  task?: GoogleTask | null
  taskListId: string
  existingContactId?: string
}

export function GoogleTaskDialog({
  open,
  onClose,
  task,
  taskListId,
  existingContactId,
}: GoogleTaskDialogProps) {
  const isEdit = !!task
  const { data: contacts = [] } = useContacts()
  const { data: allLinks = [] } = useAllTaskContactLinks()
  const createTask = useCreateGoogleTask()
  const updateTask = useUpdateGoogleTask()
  const linkTask = useLinkTaskToContact()
  const unlinkTask = useUnlinkTaskFromContact()

  const [form, setForm] = useState<GoogleTaskFormData>({
    title: '',
    notes: '',
    due: '',
    contactId: '',
  })
  const [loading, setLoading] = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  useEffect(() => {
    if (!open) return
    if (task) {
      const existingLink = allLinks.find((l) => l.google_task_id === task.id)
      setForm({
        title: task.title || '',
        notes: task.notes || '',
        due: task.due ? task.due.split('T')[0] : '',
        contactId: existingLink?.contact_id || existingContactId || '',
      })
    } else {
      setForm({
        title: '',
        notes: '',
        due: '',
        contactId: existingContactId || '',
      })
    }
    setContactSearch('')
  }, [open, task, existingContactId, allLinks])

  if (!open) return null

  const filteredContacts = contacts.filter((c) =>
    !contactSearch ||
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(contactSearch.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)

    try {
      if (isEdit && task) {
        await updateTask.mutateAsync({
          taskListId,
          taskId: task.id,
          title: form.title,
          notes: form.notes || undefined,
          due: form.due || null,
        })

        // Handle contact link changes
        const currentLink = allLinks.find((l) => l.google_task_id === task.id)
        if (currentLink && currentLink.contact_id !== form.contactId) {
          await unlinkTask.mutateAsync(currentLink.id)
        }
        if (form.contactId && (!currentLink || currentLink.contact_id !== form.contactId)) {
          await linkTask.mutateAsync({
            googleTaskId: task.id,
            googleTaskListId: taskListId,
            contactId: form.contactId,
          })
        }

        toast.success('Taak bijgewerkt')
      } else {
        const newTask = await createTask.mutateAsync({
          taskListId,
          title: form.title,
          notes: form.notes || undefined,
          due: form.due || undefined,
        })

        if (form.contactId && newTask?.id) {
          await linkTask.mutateAsync({
            googleTaskId: newTask.id,
            googleTaskListId: taskListId,
            contactId: form.contactId,
          })
        }

        toast.success('Taak aangemaakt')
      }

      onClose()
    } catch {
      toast.error('Fout bij opslaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-text-main">
              {isEdit ? 'Taak bewerken' : 'Nieuwe taak'}
            </h2>
            <button onClick={onClose} className="rounded-md p-1.5 text-text-dim hover:bg-surface-light hover:text-text-main transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">Titel</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-light px-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Taaknaam..."
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">Notities</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-light px-4 py-2.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Optionele notities..."
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">Deadline</label>
              <input
                type="date"
                value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-light px-4 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">Koppel aan contact</label>
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-light px-4 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary mb-1.5"
                placeholder="Zoek contact..."
              />
              <select
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-light px-4 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Geen contact —</option>
                {filteredContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Opslaan' : 'Aanmaken'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
