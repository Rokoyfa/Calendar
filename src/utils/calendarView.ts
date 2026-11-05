import { isOneOf } from './object.ts'

export const CALENDAR_VIEWS = ['day', 'week', 'month', 'year'] as const

export type CalendarView = (typeof CALENDAR_VIEWS)[number]

export const isCalendarView = (value: unknown): value is CalendarView => isOneOf(CALENDAR_VIEWS, value)
