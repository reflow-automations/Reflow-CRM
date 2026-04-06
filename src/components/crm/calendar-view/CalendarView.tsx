import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Contact } from '@/types/contacts'
import { STATUS_CONFIG } from '@/lib/constants'
import { cn, isOverdue } from '@/lib/utils'

interface CalendarViewProps {
  contacts: Contact[]
  onContactClick: (contact: Contact) => void
}

export function CalendarView({ contacts, onContactClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const contactsByDate = useMemo(() => {
    const map: Record<string, Contact[]> = {}
    contacts.forEach((contact) => {
      if (contact.next_follow_up) {
        const key = contact.next_follow_up
        if (!map[key]) map[key] = []
        map[key].push(contact)
      }
    })
    return map
  }, [contacts])

  const selectedContacts = selectedDate
    ? contactsByDate[format(selectedDate, 'yyyy-MM-dd')] ?? []
    : []

  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  return (
    <div className="flex gap-6">
      {/* Calendar grid */}
      <div className="flex-1 rounded-xl border border-border bg-surface/50 p-4">
        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-light hover:text-text-main"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-display text-lg font-semibold text-text-main capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: nl })}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-light hover:text-text-main"
            >
              Vandaag
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="rounded-lg p-2 text-text-muted hover:bg-surface-light hover:text-text-main"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium uppercase tracking-wider text-text-dim">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayContacts = contactsByDate[dateKey] ?? []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const hasOverdue = dayContacts.some((c) => isOverdue(c.next_follow_up))

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative flex flex-col items-center gap-1 border border-transparent p-2 transition-all min-h-[72px] rounded-lg',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'border-primary bg-primary/5',
                  isToday(day) && 'bg-surface-light',
                  isCurrentMonth && !isSelected && 'hover:bg-surface-light/50'
                )}
              >
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isToday(day) && 'bg-primary text-midnight font-bold',
                  isSelected && !isToday(day) && 'text-primary'
                )}>
                  {format(day, 'd')}
                </span>
                {dayContacts.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayContacts.slice(0, 4).map((contact) => (
                      <span
                        key={contact.id}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          hasOverdue ? 'bg-danger' : STATUS_CONFIG[contact.status]?.dotColor
                        )}
                      />
                    ))}
                    {dayContacts.length > 4 && (
                      <span className="text-[9px] text-text-dim">+{dayContacts.length - 4}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day panel */}
      <div className="w-80 rounded-xl border border-border bg-surface/50 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          <h4 className="font-display text-sm font-semibold text-text-main">
            {selectedDate
              ? format(selectedDate, 'd MMMM yyyy', { locale: nl })
              : 'Selecteer een dag'}
          </h4>
        </div>

        {selectedContacts.length === 0 ? (
          <p className="text-center text-xs text-text-dim py-8">
            {selectedDate ? 'Geen opvolgingen op deze dag' : 'Klik op een dag om opvolgingen te zien'}
          </p>
        ) : (
          <div className="space-y-2">
            {selectedContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onContactClick(contact)}
                className="w-full rounded-lg border border-border/50 bg-surface-light p-3 text-left transition-colors hover:border-border-light"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text-main">{contact.name}</span>
                </div>
                {contact.company && (
                  <p className="text-[11px] text-text-dim mb-1">{contact.company}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', STATUS_CONFIG[contact.status]?.dotColor)} />
                  <span className={cn('text-[11px] font-medium', STATUS_CONFIG[contact.status]?.color)}>
                    {STATUS_CONFIG[contact.status]?.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
