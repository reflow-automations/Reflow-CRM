import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Play, Square, Trash2, Check } from 'lucide-react'
import { useTimeEntries, useCreateTimeEntry, useDeleteTimeEntry } from '@/hooks/useTimeTracking'
import { useTimer } from '@/hooks/useTimer'
import { parseTimeInput, formatDuration, cn } from '@/lib/utils'

interface TimeTrackerProps {
  contactId: string
  subtaskId?: string
  totalMinutes?: number
}

interface PendingEntry {
  durationMinutes: number
  startedAt: string
  endedAt: string
}

export function TimeTracker({ contactId, subtaskId, totalMinutes = 0 }: TimeTrackerProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null)
  const [pendingNote, setPendingNote] = useState('')
  const noteInputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: entries = [] } = useTimeEntries(open ? contactId : null)
  const createEntry = useCreateTimeEntry()
  const deleteEntry = useDeleteTimeEntry()
  const { activeTimer, elapsedSeconds, startTimer, stopTimer } = useTimer()

  const isTimerActive = activeTimer?.contactId === contactId &&
    (subtaskId ? activeTimer.subtaskId === subtaskId : !activeTimer.subtaskId)

  useEffect(() => {
    if (pendingEntry && noteInputRef.current) {
      noteInputRef.current.focus()
    }
  }, [pendingEntry])

  useEffect(() => {
    if (!open) {
      // Auto-save pending entry without note when dropdown closes
      if (pendingEntry) {
        createEntry.mutate({
          contact_id: contactId,
          subtask_id: subtaskId,
          duration_minutes: pendingEntry.durationMinutes,
          started_at: pendingEntry.startedAt,
          ended_at: pendingEntry.endedAt,
          description: pendingNote.trim() || null,
        })
        setPendingEntry(null)
        setPendingNote('')
      }
      return
    }
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const left = rect.left + 300 > window.innerWidth ? rect.right - 300 : rect.left
      setPos({ top: rect.bottom + 4, left })
    }
    setOpen(v => !v)
  }

  const handleManualSave = () => {
    const minutes = parseTimeInput(manualInput)
    if (minutes && minutes > 0) {
      createEntry.mutate({
        contact_id: contactId,
        subtask_id: subtaskId,
        duration_minutes: minutes,
      })
      setManualInput('')
    }
  }

  const handleTimerToggle = () => {
    if (isTimerActive) {
      const result = stopTimer()
      if (result) {
        setPendingEntry(result)
        setPendingNote('')
        // Open dropdown so user can add a note
        if (!open && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect()
          const left = rect.left + 300 > window.innerWidth ? rect.right - 300 : rect.left
          setPos({ top: rect.bottom + 4, left })
          setOpen(true)
        }
      }
    } else {
      startTimer(contactId, subtaskId)
    }
  }

  const handleSavePending = () => {
    if (!pendingEntry) return
    createEntry.mutate({
      contact_id: contactId,
      subtask_id: subtaskId,
      duration_minutes: pendingEntry.durationMinutes,
      started_at: pendingEntry.startedAt,
      ended_at: pendingEntry.endedAt,
      description: pendingNote.trim() || null,
    })
    setPendingEntry(null)
    setPendingNote('')
  }

  const handleDiscardPending = () => {
    setPendingEntry(null)
    setPendingNote('')
  }

  const formatElapsed = (secs: number): string => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const recentEntries = entries.slice(0, 5)

  return (
    <div ref={triggerRef}>
      <div
        onClick={handleToggle}
        className="cursor-pointer rounded px-1.5 py-0.5 -mx-1.5 hover:bg-surface-light/60 transition-colors"
      >
        {isTimerActive ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {formatElapsed(elapsedSeconds)}
          </span>
        ) : totalMinutes > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-text-muted">
            <Clock size={12} />
            {formatDuration(totalMinutes)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-text-dim group/time">
            <span className="group-hover/time:hidden">—</span>
            <Play size={12} className="hidden group-hover/time:block text-text-dim" />
          </span>
        )}
      </div>

      {open && pos && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-[290px] rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with total */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">Time on task</span>
              <span className="text-[14px] font-bold text-primary">
                {formatDuration(totalMinutes)}
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTimerToggle}
                className={cn(
                  'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  isTimerActive
                    ? 'bg-danger/20 text-danger hover:bg-danger/30'
                    : 'bg-primary/20 text-primary hover:bg-primary/30'
                )}
              >
                {isTimerActive ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              </button>
              {isTimerActive ? (
                <span className="text-[16px] font-mono font-semibold text-primary">
                  {formatElapsed(elapsedSeconds)}
                </span>
              ) : (
                <span className="text-[12px] text-text-dim">Start timer</span>
              )}
            </div>
          </div>

          {/* Pending entry — note after timer stop */}
          {pendingEntry && (
            <div className="px-4 py-3 border-b border-border/50 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">Opgeslagen</span>
                <span className="text-[13px] font-bold text-primary">{formatDuration(pendingEntry.durationMinutes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={noteInputRef}
                  value={pendingNote}
                  onChange={(e) => setPendingNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePending()
                    if (e.key === 'Escape') handleDiscardPending()
                  }}
                  placeholder="Notitie toevoegen... (optioneel)"
                  className="flex-1 bg-surface-light border border-border rounded-md px-3 py-1.5 text-[12px] text-text-main placeholder:text-text-dim outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleSavePending}
                  className="shrink-0 w-7 h-7 rounded-md bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                >
                  <Check size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Manual entry */}
          {!pendingEntry && (
            <div className="px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualSave() }}
                  placeholder="Enter time (ex: 3h 20m)"
                  className="flex-1 bg-surface-light border border-border rounded-md px-3 py-1.5 text-[12px] text-text-main placeholder:text-text-dim outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleManualSave}
                  className="shrink-0 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-[12px] font-medium hover:bg-primary/30 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Recent entries */}
          {recentEntries.length > 0 && (
            <div className="px-4 py-2 max-h-[200px] overflow-y-auto">
              <div className="text-[10px] font-medium text-text-dim uppercase tracking-wider mb-1.5">Recent</div>
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center justify-between py-1.5 text-[12px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock size={10} className="text-text-dim shrink-0" />
                    <span className="text-text-muted font-medium shrink-0">{formatDuration(entry.duration_minutes)}</span>
                    {entry.description ? (
                      <span className="text-text-dim truncate">{entry.description}</span>
                    ) : (
                      <span className="text-text-dim shrink-0">
                        {new Date(entry.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEntry.mutate(entry.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-all shrink-0 ml-2"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
