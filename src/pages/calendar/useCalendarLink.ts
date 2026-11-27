import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useHost } from '../../context/HostContext.ts'
import type { OpenEventRequest } from '../../features/calendar/index.ts'
import type { CalendarSummary } from '../../features/calendars/index.ts'
import { isISODate } from '../../utils/date.ts'

const LINK_PARAMS = {
  calendar: 'calendar',
  event: 'event',
  date: 'date',
  tab: 'tab',
  task: 'task',
  plan: 'plan',
} as const

export function useCalendarLink(calendars: readonly CalendarSummary[], selectCalendar: (calendarId: string) => void) {
  const { features } = useHost()
  const [searchParams, setSearchParams] = useSearchParams()
  const calendarId = searchParams.get(LINK_PARAMS.calendar)
  const eventId = searchParams.get(LINK_PARAMS.event)
  const date = searchParams.get(LINK_PARAMS.date)
  const tab = searchParams.get(LINK_PARAMS.tab)
  const taskId = searchParams.get(LINK_PARAMS.task)
  const plan = searchParams.get(LINK_PARAMS.plan) === '1'
  const openEvent = useMemo<OpenEventRequest | undefined>(
    () =>
      eventId && isISODate(date)
        ? { eventId, date, tab: tab === 'chat' && features.chat ? 'chat' : undefined }
        : undefined,
    [eventId, date, tab, features.chat],
  )
  const calendarExists = calendars.some((calendar) => calendar.id === calendarId)

  useEffect(() => {
    if (calendarId && calendarExists) selectCalendar(calendarId)
  }, [calendarId, calendarExists, selectCalendar])

  const clear = useCallback(
    () =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const param of Object.values(LINK_PARAMS)) next.delete(param)
          return next
        },
        { replace: true },
      ),
    [setSearchParams],
  )

  return { calendarId, openEvent, taskId, plan, clear }
}
