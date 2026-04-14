import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatRelativeDate, isOverdue, isDueToday, cn } from '@/lib/utils'

interface InlineDateProps {
  value: string | null
  onSave: (value: string | null) => void
}

// --- date helpers ---

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

function nextWeekday(weekday: number): Date {
  // weekday: 0=Sun 1=Mon … 6=Sat
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const diff = (weekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
  return d
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT = ['Mo','Tu','We','Th','Fr','Sa','Su']
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function fmtQuick(d: Date): string {
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff < 7) return DAY_ABBR[d.getDay()]
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`
}

function getQuickOptions() {
  const weekend = nextWeekday(6)   // Saturday
  const nextMon = nextWeekday(1)   // Monday
  const nextWeekend = (() => { const d = new Date(nextMon); d.setDate(d.getDate() + 5); return d })()
  return [
    { label: 'Today',        date: addDays(0) },
    { label: 'Tomorrow',     date: addDays(1) },
    { label: 'This weekend', date: weekend },
    { label: 'Next week',    date: nextMon },
    { label: 'Next weekend', date: nextWeekend },
    { label: '2 weeks',      date: addDays(14) },
    { label: '4 weeks',      date: addDays(28) },
  ]
}

// --- calendar grid ---

function buildCalendar(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1)
  // Mon=0 … Sun=6
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// --- component ---

export function InlineDate({ value, onSave }: InlineDateProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const overdue = isOverdue(value)
  const dueToday = isDueToday(value)

  const today = new Date(); today.setHours(0,0,0,0)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => {
    if (!open) return
    // Sync calendar to selected value when opening
    if (value) {
      const d = new Date(value + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    } else {
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
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
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(v => !v)
  }

  const pick = (d: Date) => {
    onSave(toISO(d))
    setOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const weeks = buildCalendar(viewYear, viewMonth)
  const quickOptions = getQuickOptions()

  const selectedISO = value
  const todayISO = toISO(today)

  return (
    <div ref={triggerRef}>
      <div
        onClick={handleToggle}
        className="cursor-pointer rounded px-1.5 py-0.5 -mx-1.5 hover:bg-surface-light/60 transition-colors"
      >
        {value ? (
          <span className={cn(
            'inline-flex items-center gap-1.5 text-[12px] font-medium',
            overdue ? 'text-danger' : dueToday ? 'text-yellow-400' : 'text-text-muted'
          )}>
            <Calendar size={12} />
            {formatRelativeDate(value)}
          </span>
        ) : (
          <span className="text-[12px] text-text-dim">—</span>
        )}
      </div>

      {open && pos && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="flex rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick options */}
          <div className="border-r border-border py-2 w-[160px] flex flex-col">
            {quickOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => pick(opt.date)}
                className={cn(
                  'flex items-center justify-between px-3 py-1.5 text-[12px] transition-colors',
                  selectedISO === toISO(opt.date)
                    ? 'text-primary bg-primary/10'
                    : 'text-text-muted hover:bg-surface-light hover:text-text-main'
                )}
              >
                <span>{opt.label}</span>
                <span className="text-[11px] text-text-dim">{fmtQuick(opt.date)}</span>
              </button>
            ))}
            {value && (
              <button
                onClick={() => { onSave(null); setOpen(false) }}
                className="flex items-center px-3 py-1.5 mt-1 text-[12px] text-danger hover:bg-danger/10 transition-colors border-t border-border"
              >
                Clear date
              </button>
            )}
          </div>

          {/* Calendar */}
          <div className="p-3" style={{ width: '240px' }}>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="p-1 rounded hover:bg-surface-light text-text-dim hover:text-text-main transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-text-main">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-surface-light text-text-dim hover:text-primary transition-colors"
                >
                  Today
                </button>
              </div>
              <button
                onClick={nextMonth}
                className="p-1 rounded hover:bg-surface-light text-text-dim hover:text-text-main transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_SHORT.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-text-dim py-0.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  if (!day) return <div key={di} />
                  const iso = toISO(day)
                  const isToday = iso === todayISO
                  const isSelected = iso === selectedISO
                  return (
                    <button
                      key={di}
                      onClick={() => pick(day)}
                      className={cn(
                        'relative flex items-center justify-center text-[12px] rounded-md h-7 w-full transition-colors',
                        isSelected
                          ? 'bg-primary text-midnight font-bold'
                          : isToday
                          ? 'text-primary font-semibold hover:bg-primary/15'
                          : 'text-text-muted hover:bg-surface-light hover:text-text-main'
                      )}
                    >
                      {day.getDate()}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
