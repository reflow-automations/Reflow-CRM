import { useState, useEffect, useCallback, useRef } from 'react'

interface ActiveTimer {
  contactId: string
  subtaskId?: string
  startedAt: number // Date.now()
}

const STORAGE_KEY = 'crm-active-timer'

function loadTimer(): ActiveTimer | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function saveTimer(timer: ActiveTimer | null) {
  if (timer) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function useTimer() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(loadTimer)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update elapsed seconds every second when timer is active
  useEffect(() => {
    if (activeTimer) {
      const update = () => {
        setElapsedSeconds(Math.floor((Date.now() - activeTimer.startedAt) / 1000))
      }
      update()
      intervalRef.current = setInterval(update, 1000)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } else {
      setElapsedSeconds(0)
    }
  }, [activeTimer])

  const startTimer = useCallback((contactId: string, subtaskId?: string) => {
    const timer: ActiveTimer = { contactId, subtaskId, startedAt: Date.now() }
    setActiveTimer(timer)
    saveTimer(timer)
  }, [])

  const stopTimer = useCallback((): { durationMinutes: number; startedAt: string; endedAt: string } | null => {
    if (!activeTimer) return null
    const endedAt = new Date()
    const startedAt = new Date(activeTimer.startedAt)
    const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))

    setActiveTimer(null)
    saveTimer(null)

    return {
      durationMinutes,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    }
  }, [activeTimer])

  return { activeTimer, elapsedSeconds, startTimer, stopTimer }
}
