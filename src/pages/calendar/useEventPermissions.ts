import { useCallback } from 'react'
import type { CalendarEvent } from '../../domain/event.ts'
import { isCaldavEvent, type CaldavCalendar } from '../../features/caldav/index.ts'
import { canDeleteEntry, canEditEntry, type CalendarSummary } from '../../features/calendars/index.ts'
import { isExternalEvent } from '../../features/external/index.ts'
import { isOwnPendingRequest, isPeerEvent } from '../../features/peers/index.ts'

export function useEventPermissions(
  calendarById: ReadonlyMap<string, CalendarSummary>,
  caldavById: ReadonlyMap<string, CaldavCalendar>,
  userId: string | null,
) {
  const eventAccess = useCallback(
    (event: CalendarEvent, check: (calendar: CalendarSummary) => boolean, unknownCalendar: boolean) => {
      if (isExternalEvent(event)) return false
      if (isPeerEvent(event)) return isOwnPendingRequest(event)
      if (isCaldavEvent(event)) return caldavById.get(event.calendarId)?.readOnly === false
      const calendar = calendarById.get(event.calendarId)
      return calendar ? check(calendar) : unknownCalendar
    },
    [calendarById, caldavById],
  )
  const canEditEvent = useCallback(
    (event: CalendarEvent) => eventAccess(event, (calendar) => canEditEntry(calendar, event.createdBy, userId), true),
    [eventAccess, userId],
  )
  const canMoveEvent = useCallback(
    (event: CalendarEvent) =>
      eventAccess(event, (calendar) => canDeleteEntry(calendar, event.createdBy, userId), false),
    [eventAccess, userId],
  )
  return { canEditEvent, canMoveEvent }
}
