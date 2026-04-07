import { GoogleAuthError } from './google-tasks-api'

const BASE = 'https://www.googleapis.com/calendar/v3'

export interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  htmlLink: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  status: string
}

async function request<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) {
    throw new GoogleAuthError('Google sessie verlopen')
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Calendar API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

/**
 * Fetch the next upcoming event from the user's primary calendar.
 * Returns null if no upcoming events.
 */
export async function fetchNextEvent(token: string): Promise<GoogleCalendarEvent | null> {
  const now = new Date().toISOString()
  const params = new URLSearchParams({
    timeMin: now,
    maxResults: '1',
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const data = await request<{ items: GoogleCalendarEvent[] }>(
    token,
    `${BASE}/calendars/primary/events?${params}`
  )

  return data.items?.[0] || null
}
