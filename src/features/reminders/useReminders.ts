import { useCallback, useEffect, useState } from 'react'
import { useViewerTimeZone } from '../../context/HostContext.ts'
import { useCalendars } from '../calendars/index.ts'
import { useStorage } from '../storage/index.ts'
import { getReminderRange, getScheduledReminders, type ScheduledReminder } from '../../utils/reminders.ts'

const CHECK_INTERVAL_MS = 5 * 60_000
const LATE_TOLERANCE_MS = 10 * 60_000
const FIRED_KEY = 'calendar.firedReminders.v1'
const FIRED_RETENTION_MS = 2 * 24 * 60 * 60_000

type FiredReminders = Record<string, number>

const readFired = (): FiredReminders => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(FIRED_KEY) ?? '{}')
    return typeof parsed === 'object' && parsed !== null ? (parsed as FiredReminders) : {}
  } catch {
    return {}
  }
}

const markFired = (key: string, now: number) => {
  const fired = Object.fromEntries(Object.entries(readFired()).filter(([, at]) => now - at < FIRED_RETENTION_MS))
  fired[key] = now
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(fired))
  } catch {
    return
  }
}

export function useReminders(notify: (reminder: ScheduledReminder) => void) {
  const { events: repository, version } = useStorage()
  const { calendars } = useCalendars()
  const viewerTimeZone = useViewerTimeZone()
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    const interval = setInterval(refresh, CHECK_INTERVAL_MS)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh])

  useEffect(() => {
    const calendarIds = calendars.map((calendar) => calendar.id)
    if (calendarIds.length === 0) return
    let isCurrent = true
    const timers: ReturnType<typeof setTimeout>[] = []
    const now = Date.now()

    const fire = (reminder: ScheduledReminder) => {
      if (!isCurrent || readFired()[reminder.key] !== undefined) return
      markFired(reminder.key, Date.now())
      notify(reminder)
    }

    void repository
      .list({ ...getReminderRange(now), calendarIds })
      .then((events) => {
        if (!isCurrent) return
        for (const reminder of getScheduledReminders(
          events,
          viewerTimeZone,
          now - LATE_TOLERANCE_MS,
          now + CHECK_INTERVAL_MS * 2,
        ))
          timers.push(setTimeout(() => fire(reminder), Math.max(reminder.at - Date.now(), 0)))
      })
      .catch(() => undefined)

    return () => {
      isCurrent = false
      timers.forEach(clearTimeout)
    }
  }, [repository, calendars, viewerTimeZone, version, tick, notify])
}
