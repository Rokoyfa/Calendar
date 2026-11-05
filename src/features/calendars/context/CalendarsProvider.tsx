import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { PERSONAL_CALENDAR } from '../constants/calendars.ts'
import type { CalendarDraft, CalendarsContextValue, CalendarSummary } from '../types/calendar.ts'
import { normalizeDraft } from '../utils/draft.ts'
import { canLeaveCalendar, getVisibleCalendarIds, isPersonalCalendar } from '../utils/permissions.ts'
import { CalendarsContext } from './CalendarsContext.ts'

const INITIAL_CALENDARS: readonly CalendarSummary[] = [PERSONAL_CALENDAR]

export function CalendarsProvider({ children }: { children: ReactNode }) {
  const [calendars, setCalendars] = useState(INITIAL_CALENDARS)
  const [activeId, setActiveId] = useState(PERSONAL_CALENDAR.id)
  const activeCalendar = calendars.find((calendar) => calendar.id === activeId) ?? PERSONAL_CALENDAR

  const selectCalendar = useCallback((id: string) => setActiveId(id), [])

  const createCalendar = useCallback(async (draft: CalendarDraft) => {
    const { name, description, color } = normalizeDraft(draft)
    const calendar: CalendarSummary = {
      id: crypto.randomUUID(),
      name,
      color,
      kind: 'team',
      teamName: name,
      description,
      role: 'owner',
      showInPersonal: true,
    }
    setCalendars((current) => [...current, calendar])
    return calendar
  }, [])

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
    () => ({
      calendars,
      activeCalendar,
      visibleCalendarIds,
      selectCalendar,
      createCalendar,
      leaveCalendar,
      setShowInPersonal,
    }),
    [calendars, activeCalendar, visibleCalendarIds, selectCalendar, createCalendar, leaveCalendar, setShowInPersonal],
  )

  return <CalendarsContext value={value}>{children}</CalendarsContext>
}
