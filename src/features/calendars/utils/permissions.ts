import type { CalendarSummary } from '../types/calendar.ts'

export const isPersonalCalendar = ({ kind }: CalendarSummary) => kind === 'personal'

export const canLeaveCalendar = (calendar: CalendarSummary) =>
  !isPersonalCalendar(calendar) && calendar.role !== 'owner'

export const getVisibleCalendarIds = (calendars: readonly CalendarSummary[], active: CalendarSummary) =>
  isPersonalCalendar(active)
    ? calendars.filter((calendar) => isPersonalCalendar(calendar) || calendar.showInPersonal).map(({ id }) => id)
    : [active.id]
