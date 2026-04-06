import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
  color?: string
  dotColor?: string
  bgColor?: string
}

interface InlineSelectProps {
  value: string
  options: Option[]
  onSave: (value: string) => void
  renderValue: React.ReactNode
}

export function InlineSelect({ value, options, onSave, renderValue }: InlineSelectProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(v => !v)
  }

  return (
    <div ref={triggerRef}>
      <div
        onClick={handleToggle}
        className="cursor-pointer rounded px-1 py-0.5 -mx-1 hover:bg-surface-light/60 transition-colors"
      >
        {renderValue}
      </div>

      {open && pos && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="min-w-[180px] rounded-lg border border-border bg-surface shadow-xl shadow-black/30 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onSave(option.value); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors',
                value === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-muted hover:bg-surface-light hover:text-text-main'
              )}
            >
              {option.dotColor && (
                <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', option.dotColor)} />
              )}
              {option.bgColor && !option.dotColor && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', option.bgColor)}>
                  {option.label}
                </span>
              )}
              {!option.bgColor && !option.dotColor && option.label}
              {option.dotColor && option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
