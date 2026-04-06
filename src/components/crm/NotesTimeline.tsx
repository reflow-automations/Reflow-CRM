import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useContactNotes, useAddContactNote } from '@/hooks/useContacts'
import { formatDate } from '@/lib/utils'

interface NotesTimelineProps {
  contactId: string
}

export function NotesTimeline({ contactId }: NotesTimelineProps) {
  const { data: notes = [], isLoading } = useContactNotes(contactId)
  const addNote = useAddContactNote()
  const [newNote, setNewNote] = useState('')

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    await addNote.mutateAsync({ contactId, content: newNote.trim() })
    setNewNote('')
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-text-muted">Notities</h4>

      {/* Add note form */}
      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Voeg een notitie toe..."
          className="flex-1 rounded-lg border border-border bg-surface-light px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={addNote.isPending || !newNote.trim()}
          className="rounded-lg bg-primary px-3 py-2 text-midnight hover:bg-primary-hover disabled:opacity-50"
        >
          {addNote.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-text-muted" />
        </div>
      ) : notes.length === 0 ? (
        <p className="py-2 text-center text-xs text-text-dim">Nog geen notities</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-border/50 bg-surface-light/50 px-3 py-2">
              <p className="text-sm text-text-main">{note.content}</p>
              <p className="mt-1 text-[11px] text-text-dim">{formatDate(note.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
