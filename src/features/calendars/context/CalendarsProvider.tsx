import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { PERSONAL_CALENDAR } from '../constants/calendars.ts'
import type { CalendarsContextValue, CalendarSummary } from '../types/calendar.ts'
import { CalendarsContext } from './CalendarsContext.ts'

const AVAILABLE_CALENDARS: readonly CalendarSummary[] = [PERSONAL_CALENDAR]

export function CalendarsProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState(PERSONAL_CALENDAR.id)
  const activeCalendar = AVAILABLE_CALENDARS.find((calendar) => calendar.id === activeId) ?? PERSONAL_CALENDAR

  const selectCalendar = useCallback((id: string) => {
    if (AVAILABLE_CALENDARS.some((calendar) => calendar.id === id)) setActiveId(id)
  }, [])

  const value = useMemo<CalendarsContextValue>(
    () => ({ calendars: AVAILABLE_CALENDARS, activeCalendar, selectCalendar }),
    [activeCalendar, selectCalendar],
  )

  return <CalendarsContext value={value}>{children}</CalendarsContext>
}
