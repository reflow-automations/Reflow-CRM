import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { STATUS_ORDER, type ContactStatus } from '@/lib/constants'
import type { Contact } from '@/types/contacts'
import type { SortEntry, SortField } from '../CRMPage'
import { StatusGroup } from './StatusGroup'
import { useSubtaskCounts } from '@/hooks/useSubtasks'
import { useTimeTotals } from '@/hooks/useTimeTracking'
import { cn } from '@/lib/utils'

const PRIORITY_ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 }

function compareContacts(a: Contact, b: Contact, field: SortField, dir: 'asc' | 'desc'): number {
  const mult = dir === 'asc' ? 1 : -1
  switch (field) {
    case 'name':
      return mult * a.name.localeCompare(b.name)
    case 'company':
      return mult * (a.company || '').localeCompare(b.company || '')
    case 'next_follow_up': {
      const aDate = a.next_follow_up ? new Date(a.next_follow_up).getTime() : Infinity
      const bDate = b.next_follow_up ? new Date(b.next_follow_up).getTime() : Infinity
      return mult * (aDate - bDate)
    }
    case 'priority':
      return mult * ((PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
    case 'source':
      return mult * a.source.localeCompare(b.source)
    default:
      return 0
  }
}

function sortContacts(contacts: Contact[], sorts: SortEntry[]): Contact[] {
  if (sorts.length === 0) return contacts
  return [...contacts].sort((a, b) => {
    for (const sort of sorts) {
      const result = compareContacts(a, b, sort.field, sort.dir)
      if (result !== 0) return result
    }
    return 0
  })
}

interface ColDef {
  field: SortField | null
  label: string
  defaultWidth: number
  minWidth: number
}

export const COLUMNS: ColDef[] = [
  { field: 'name', label: 'Name', defaultWidth: 190, minWidth: 120 },
  { field: 'company', label: 'Company', defaultWidth: 160, minWidth: 100 },
  { field: null, label: 'Notes', defaultWidth: 210, minWidth: 120 },
  { field: null, label: 'Time', defaultWidth: 90, minWidth: 70 },
  { field: 'next_follow_up', label: 'Next Follow-up', defaultWidth: 130, minWidth: 100 },
  { field: 'priority', label: 'Priority', defaultWidth: 90, minWidth: 70 },
  { field: 'source', label: 'Source', defaultWidth: 130, minWidth: 90 },
  { field: null, label: 'Email', defaultWidth: 160, minWidth: 110 },
]

const STORAGE_KEY = 'crm-column-widths-v2'
const DEFAULT_WIDTHS = COLUMNS.map(c => c.defaultWidth)

function loadWidths(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length === COLUMNS.length) {
        // Enforce minimums on stored widths
        return parsed.map((w, i) => Math.max(COLUMNS[i].minWidth, w))
      }
    }
  } catch {}
  return [...DEFAULT_WIDTHS]
}

interface ListViewProps {
  contacts: Contact[]
  onContactClick: (contact: Contact) => void
  onAddContact: (status: ContactStatus) => void
  filter: {
    search: string
    status: ContactStatus | 'all'
    priority: string
    source: string
  }
  sorts: SortEntry[]
  onToggleSort: (field: SortField) => void
}

export function ListView({ contacts, onContactClick, onAddContact, filter, sorts, onToggleSort }: ListViewProps) {
  const { data: subtaskCounts = {} } = useSubtaskCounts()
  const { data: timeTotals = {} } = useTimeTotals()
  const [columnWidths, setColumnWidths] = useState<number[]>(loadWidths)
  const resizingRef = useRef<{ colIdx: number; startX: number; startWidth: number } | null>(null)
  const widthsRef = useRef(columnWidths)
  widthsRef.current = columnWidths

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths))
  }, [columnWidths])

  const startResize = useCallback((e: React.MouseEvent, colIdx: number) => {
    e.preventDefault()
    e.stopPropagation()
    resizingRef.current = { colIdx, startX: e.clientX, startWidth: widthsRef.current[colIdx] }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const { colIdx: idx, startX, startWidth } = resizingRef.current
      const minWidth = COLUMNS[idx]?.minWidth ?? 60
      const newWidth = Math.max(minWidth, startWidth + (ev.clientX - startX))
      setColumnWidths(prev => {
        const next = [...prev]
        next[idx] = newWidth
        return next
      })
    }

    const onMouseUp = () => {
      resizingRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const filteredContacts = useMemo(() => contacts.filter((c) => {
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !c.company?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false
    }
    if (filter.status !== 'all' && c.status !== filter.status) return false
    if (filter.priority && filter.priority !== 'all' && c.priority !== filter.priority) return false
    if (filter.source && filter.source !== 'all' && c.source !== filter.source) return false
    return true
  }), [contacts, filter])

  const groupedByStatus = useMemo(() => {
    return STATUS_ORDER.reduce<Record<ContactStatus, Contact[]>>((acc, status) => {
      acc[status] = sortContacts(filteredContacts.filter(c => c.status === status), sorts)
      return acc
    }, {} as Record<ContactStatus, Contact[]>)
  }, [filteredContacts, sorts])

  const statusesToShow = filter.status !== 'all' ? [filter.status] : STATUS_ORDER

  if (filteredContacts.length === 0) {
    return (
      <div className="border-t border-border py-16 text-center">
        <p className="text-sm text-text-dim">Geen contacten gevonden</p>
      </div>
    )
  }

  return (
    <div className="border-t border-border overflow-x-auto">
      <table style={{ minWidth: '960px', width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
        <colgroup>
          {columnWidths.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border/30">
            {COLUMNS.map((col, i) => {
              const isSortable = col.field !== null
              const sortEntry = col.field ? sorts.find(s => s.field === col.field) : null
              const sortIdx = col.field ? sorts.findIndex(s => s.field === col.field) : -1
              const isLast = i === COLUMNS.length - 1
              return (
                <th
                  key={col.label}
                  className={cn(
                    'relative py-2 text-left text-[11px] font-medium whitespace-nowrap select-none overflow-hidden',
                    i === 0 ? 'pl-10 pr-4' : 'px-4',
                    isSortable ? 'cursor-pointer hover:text-text-muted transition-colors' : '',
                    sortEntry ? 'text-primary' : 'text-text-dim'
                  )}
                  onClick={isSortable && col.field ? () => onToggleSort(col.field!) : undefined}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    {sortEntry && (
                      <span className="inline-flex items-center gap-0.5 ml-1">
                        {sortEntry.dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                        {sorts.length > 1 && (
                          <span className="text-[9px] bg-primary/20 text-primary rounded-full w-3.5 h-3.5 inline-flex items-center justify-center font-bold">
                            {sortIdx + 1}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  {/* Resize handle */}
                  {!isLast && (
                    <span
                      className="absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-col-resize z-10 group/resize"
                      onMouseDown={(e) => startResize(e, i)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="w-px h-4 bg-border/40 group-hover/resize:bg-primary/70 group-hover/resize:h-full transition-all" />
                    </span>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        {statusesToShow.map(status => (
          <StatusGroup
            key={status}
            status={status}
            contacts={groupedByStatus[status] ?? []}
            onContactClick={onContactClick}
            onAddContact={onAddContact}
            columnCount={COLUMNS.length}
            subtaskCounts={subtaskCounts}
            timeTotals={timeTotals}
          />
        ))}
      </table>
    </div>
  )
}
