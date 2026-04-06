import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineTextareaProps {
  value: string
  onSave: (value: string) => void
  className?: string
  placeholder?: string
  previewLines?: number
}

/** Render text with --- lines as horizontal rules */
function renderNoteOverlay(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.trim() === '---') {
      return (
        <span key={i} className="block">
          <hr
            className="border-none my-1"
            style={{ height: '1px', background: 'rgba(148,163,184,0.35)' }}
          />
        </span>
      )
    }
    // Use a zero-width space for empty lines to maintain height
    return (
      <span key={i} className="block leading-relaxed whitespace-pre-wrap">
        {line || '\u200B'}
      </span>
    )
  })
}

export function InlineTextarea({ value, onSave, className, placeholder = '—', previewLines = 1 }: InlineTextareaProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(draft.length, draft.length)
      autoResize()
    }
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }

  const syncScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const commit = () => {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  const hasSeparators = draft.includes('---')

  if (editing) {
    return (
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); autoResize() }}
          onBlur={commit}
          onScroll={syncScroll}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setDraft(value); setEditing(false) }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit()
          }}
          className="bg-midnight border border-primary/60 rounded-md px-2.5 py-1.5 text-[12px] outline-none w-full resize-none leading-relaxed"
          style={{
            minHeight: '60px',
            color: hasSeparators ? 'transparent' : 'white',
            caretColor: 'white',
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {/* Overlay renders --- as HR while typing */}
        {hasSeparators && (
          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none px-2.5 py-1.5 text-[12px] text-white leading-relaxed overflow-hidden rounded-md"
            style={{ borderWidth: '1px', borderColor: 'transparent' }}
          >
            {renderNoteOverlay(draft)}
          </div>
        )}
      </div>
    )
  }

  if (!value) {
    return (
      <span
        onClick={(e) => { e.stopPropagation(); setEditing(true) }}
        className={cn(
          'cursor-text rounded px-1.5 py-0.5 -mx-1.5 hover:bg-surface-light/60 transition-colors block line-clamp-1 text-text-dim italic',
          className
        )}
      >
        {placeholder}
      </span>
    )
  }

  // Replace standalone --- lines with a separator for the collapsed preview
  const previewText = value.replace(/\n---(\n|$)/g, ' · ').replace(/^---\n/, '')

  // Always show collapsed preview regardless of --- content
  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
      className={cn(
        'cursor-text rounded px-1.5 py-0.5 -mx-1.5 hover:bg-surface-light/60 transition-colors block',
        previewLines === 1 ? 'line-clamp-1' : `line-clamp-${previewLines}`,
        className
      )}
      title={value}
    >
      {previewText}
    </span>
  )
}
