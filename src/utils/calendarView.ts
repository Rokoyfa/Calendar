import { isOneOf } from './object.ts'

export const CALENDAR_VIEWS = ['day', 'week', 'month', 'year'] as const

export type CalendarView = (typeof CALENDAR_VIEWS)[number]

export const isCalendarView = (value: unknown): value is CalendarView => isOneOf(CALENDAR_VIEWS, value)

export const nearestView = (wanted: CalendarView, enabled: readonly CalendarView[]): CalendarView => {
  if (enabled.includes(wanted) || enabled.length === 0) return wanted
  const position = CALENDAR_VIEWS.indexOf(wanted)
  return [...enabled].sort(
    (a, b) => Math.abs(CALENDAR_VIEWS.indexOf(a) - position) - Math.abs(CALENDAR_VIEWS.indexOf(b) - position),
  )[0]
}
