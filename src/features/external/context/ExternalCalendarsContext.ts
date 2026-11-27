import { createContext } from 'react'
import type { CalendarEvent } from '../../../domain/event.ts'
import type { ExternalCalendar, ExternalCalendarChanges, ExternalCalendarInput } from '../utils/externalCalendar.ts'

export type ExternalCalendarsContextValue = {
  isAvailable: boolean
  calendars: readonly ExternalCalendar[]
  events: readonly CalendarEvent[]
  failedIds: ReadonlySet<string>
  isLoading: boolean
  error: string | null
  create: (input: ExternalCalendarInput) => Promise<void>
  update: (id: string, changes: ExternalCalendarChanges) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: (id: string) => void
}

const unavailable = () => Promise.resolve()

export const NO_EXTERNAL_CALENDARS: ExternalCalendarsContextValue = {
  isAvailable: false,
  calendars: [],
  events: [],
  failedIds: new Set(),
  isLoading: false,
  error: null,
  create: unavailable,
  update: unavailable,
  remove: unavailable,
  refresh: () => undefined,
}

export const ExternalCalendarsContext = createContext<ExternalCalendarsContextValue>(NO_EXTERNAL_CALENDARS)
