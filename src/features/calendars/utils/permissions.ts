import type { CalendarSummary, Permission } from '../types/calendar.ts'

export const isPersonalCalendar = ({ kind }: CalendarSummary) => kind === 'personal'

export const canLeaveCalendar = (calendar: CalendarSummary) =>
  !isPersonalCalendar(calendar) && calendar.role !== 'owner'

export const getVisibleCalendarIds = (calendars: readonly CalendarSummary[], active: CalendarSummary) =>
  isPersonalCalendar(active)
    ? calendars.filter((calendar) => isPersonalCalendar(calendar) || calendar.showInPersonal).map(({ id }) => id)
    : [active.id]

export const hasPermission = (calendar: CalendarSummary, permission: Permission) =>
  calendar.permissions.includes(permission)

export const getSharedCalendars = (calendars: readonly CalendarSummary[], active: CalendarSummary) =>
  isPersonalCalendar(active)
    ? calendars.filter((calendar) => !isPersonalCalendar(calendar) && calendar.showInPersonal)
    : []
