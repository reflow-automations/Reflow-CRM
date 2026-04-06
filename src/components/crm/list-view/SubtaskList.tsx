import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useSubtasks, useCreateSubtask } from '@/hooks/useSubtasks'
import { useSubtaskTimeTotals } from '@/hooks/useTimeTracking'
import { SubtaskRow } from './SubtaskRow'

interface SubtaskListProps {
  contactId: string
  columnCount: number
}

export function SubtaskList({ contactId, columnCount }: SubtaskListProps) {
  const { data: subtasks = [] } = useSubtasks(contactId)
  const { data: subtaskTimeTotals = {} } = useSubtaskTimeTotals(contactId)
  const createSubtask = useCreateSubtask()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus()
  }, [adding])

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) { setAdding(false); return }
    createSubtask.mutate({ contactId, name })
    setNewName('')
    // Keep input open for adding multiple
  }

  return (
    <>
      {subtasks.map((subtask) => (
        <SubtaskRow key={subtask.id} subtask={subtask} columnCount={columnCount} totalMinutes={subtaskTimeTotals[subtask.id] || 0} />
      ))}

      {/* Add subtask row */}
      <tr className="border-b border-border/10">
        <td colSpan={columnCount} className="py-0">
          {adding ? (
            <div className="pl-16 pr-4 py-1.5">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setNewName(''); setAdding(false) }
                }}
                onBlur={handleCreate}
                placeholder="Subtask naam..."
                className="bg-transparent border-b border-primary/40 outline-none text-[12px] text-text-muted w-64 py-0.5 placeholder:text-text-dim"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setAdding(true) }}
              className="flex items-center gap-1.5 pl-16 py-1.5 text-[11px] text-text-dim hover:text-primary transition-colors"
            >
              <Plus size={11} />
              Add subtask
            </button>
          )}
        </td>
      </tr>
    </>
  )
}
