import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) {
    return target.toLocaleDateString('en-US', { weekday: 'short' })
  }
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`
  return formatDate(date)
}

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export function generateId(): string {
  return crypto.randomUUID()
}

/** Parse time input like "3h 20m", "2h", "45m", "1:30", "90" → minutes */
export function parseTimeInput(input: string): number | null {
  const s = input.trim().toLowerCase()
  if (!s) return null

  // "1:30" format
  const colonMatch = s.match(/^(\d+):(\d+)$/)
  if (colonMatch) {
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
  }

  // "3h 20m", "2h", "45m" format
  const hourMatch = s.match(/(\d+)\s*h/)
  const minMatch = s.match(/(\d+)\s*m/)
  if (hourMatch || minMatch) {
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0
    const mins = minMatch ? parseInt(minMatch[1]) : 0
    return hours * 60 + mins
  }

  // Plain number → assume minutes
  const num = parseInt(s)
  if (!isNaN(num) && num >= 0) return num

  return null
}

/** Format minutes to "3h 20m" or "45m" or "0m" */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
