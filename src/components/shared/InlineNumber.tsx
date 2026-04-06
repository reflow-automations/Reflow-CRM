import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineNumberProps {
  value: number
  min?: number
  max?: number
  onSave: (value: number) => void
  className?: string
}

export function InlineNumber({ value, min = 1, max = 10, onSave, className }: InlineNumberProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    setEditing(false)
    const num = parseInt(draft, 10)
    if (!isNaN(num) && num >= min && num <= max && num !== value) {
      onSave(num)
    } else {
      setDraft(String(value))
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) }
        }}
        className={cn(
          'w-12 bg-surface-light border border-primary/50 rounded text-center py-1 text-sm text-text-main outline-none',
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
        'inline-flex h-8 w-10 items-center justify-center rounded-md bg-surface-light text-sm font-medium text-text-main cursor-pointer hover:bg-surface-hover hover:ring-1 hover:ring-primary/30 transition-all',
        className
      )}
      title="Klik om te bewerken"
    >
      {value}
    </span>
  )
}
