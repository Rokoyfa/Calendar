import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { PERSONAL_CALENDAR } from '../constants/calendars.ts'
import type { CalendarsContextValue, CalendarSummary } from '../types/calendar.ts'
import { canLeaveCalendar, getVisibleCalendarIds, isPersonalCalendar } from '../utils/permissions.ts'
import { CalendarsContext } from './CalendarsContext.ts'

const INITIAL_CALENDARS: readonly CalendarSummary[] = [PERSONAL_CALENDAR]

export function CalendarsProvider({ children }: { children: ReactNode }) {
  const [calendars, setCalendars] = useState(INITIAL_CALENDARS)
  const [activeId, setActiveId] = useState(PERSONAL_CALENDAR.id)
  const activeCalendar = calendars.find((calendar) => calendar.id === activeId) ?? PERSONAL_CALENDAR

  const selectCalendar = useCallback(
    (id: string) => {
      if (calendars.some((calendar) => calendar.id === id)) setActiveId(id)
    },
    [calendars],
  )

  const leaveCalendar = useCallback(async (id: string) => {
    setCalendars((current) => current.filter((calendar) => calendar.id !== id || !canLeaveCalendar(calendar)))
  }, [])

  const setShowInPersonal = useCallback(async (id: string, showInPersonal: boolean) => {
    setCalendars((current) =>
      current.map((calendar) =>
        calendar.id === id && !isPersonalCalendar(calendar) ? { ...calendar, showInPersonal } : calendar,
      ),
    )
  }, [])

  const visibleCalendarIds = useMemo(
    () => getVisibleCalendarIds(calendars, activeCalendar),
    [calendars, activeCalendar],
  )

  const value = useMemo<CalendarsContextValue>(
    () => ({ calendars, activeCalendar, visibleCalendarIds, selectCalendar, leaveCalendar, setShowInPersonal }),
    [calendars, activeCalendar, visibleCalendarIds, selectCalendar, leaveCalendar, setShowInPersonal],
  )

  return <CalendarsContext value={value}>{children}</CalendarsContext>
}
