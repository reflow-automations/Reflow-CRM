import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineTextProps {
  value: string
  onSave: (value: string) => void
  className?: string
  placeholder?: string
}

export function InlineText({ value, onSave, className, placeholder = '—' }: InlineTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    setEditing(false)
    if (draft !== value) {
      onSave(draft)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className={cn(
          'bg-surface-light border border-primary/50 rounded px-2 py-0.5 text-text-main outline-none w-full',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
      className={cn(
        'cursor-text rounded px-1.5 py-0.5 -mx-1.5 hover:bg-surface-light/60 transition-colors',
        !value && 'text-text-dim italic',
        className
      )}
      title="Klik om te bewerken"
    >
      {value || placeholder}
    </span>
  )
}
