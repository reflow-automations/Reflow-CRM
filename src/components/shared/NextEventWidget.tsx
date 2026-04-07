import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ExternalLink } from 'lucide-react'
import { useGoogleAuth } from '@/contexts/GoogleAuthContext'
import { fetchNextEvent } from '@/lib/google-calendar-api'
import { GoogleAuthError } from '@/lib/google-tasks-api'

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60000)

  if (diffMin < 0) return 'nu bezig'
  if (diffMin < 1) return 'nu'
  if (diffMin < 60) return `over ${diffMin} min`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `over ${diffHr} uur`
  const diffDays = Math.round(diffHr / 24)
  if (diffDays === 1) return 'morgen'
  return `over ${diffDays} dagen`
}

function isToday(date: Date): boolean {
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

export function NextEventWidget() {
  const { isAuthenticated, accessToken, signOutGoogle } = useGoogleAuth()
  const [, forceTick] = useState(0)

  // Re-render every 30 seconds so the relative time stays fresh
  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 30_000)
    return () => clearInterval(i)
  }, [])

  const { data: event, error } = useQuery({
    queryKey: ['next-calendar-event'],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated')
      try {
        return await fetchNextEvent(accessToken)
      } catch (err) {
        if (err instanceof GoogleAuthError) {
          signOutGoogle()
        }
        throw err
      }
    },
    enabled: !!accessToken,
    refetchInterval: 60_000, // refetch every minute
    staleTime: 30_000,
  })

  if (!isAuthenticated || error || !event) return null

  const startStr = event.start.dateTime || event.start.date
  if (!startStr) return null
  const startDate = new Date(startStr)
  const isAllDay = !event.start.dateTime
  const title = event.summary || '(geen titel)'
  const relativeTime = isAllDay
    ? isToday(startDate) ? 'vandaag' : startDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : formatRelativeTime(startDate)
  const timeStr = isAllDay
    ? null
    : startDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })

  return (
    <a
      href={event.htmlLink}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed top-4 right-6 z-30 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] shadow-lg shadow-black/20 hover:border-primary/40 hover:bg-surface-light transition-colors max-w-[320px]"
      title={`${title}${timeStr ? ` om ${timeStr}` : ''}`}
    >
      <Calendar size={13} className="shrink-0 text-primary" />
      <span className="truncate font-medium text-text-main">{title}</span>
      <span className="shrink-0 text-text-dim">{relativeTime}</span>
      <ExternalLink size={11} className="shrink-0 text-text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}
