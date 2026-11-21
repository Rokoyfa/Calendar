import { isEventColor, type CalendarEvent, type EventColor } from './event.ts'
import { asRecord, parseList } from './parse.ts'

export const EXTERNAL_CALENDAR_PREFIX = 'external:'
export const MAX_EXTERNAL_CALENDARS = 10
export const EXTERNAL_CALENDAR_NAME_MAX_LENGTH = 80
export const EXTERNAL_CALENDAR_URL_MAX_LENGTH = 2000

export type ExternalCalendar = {
  id: string
  name: string
  color: EventColor
  shown: boolean
  position: number
  urlHost: string
  fetchedAt: string | null
  error: string | null
}

export type ExternalCalendarInput = { name: string; url: string; color: EventColor }

export type ExternalCalendarChanges = Partial<ExternalCalendarInput & { shown: boolean; position: number }>

export const parseExternalCalendar = (value: unknown): ExternalCalendar | null => {
  const record = asRecord(value)
  if (typeof record.id !== 'string' || typeof record.name !== 'string') return null
  return {
    id: record.id,
    name: record.name,
    color: isEventColor(record.color) ? record.color : 'blue',
    shown: record.shown !== false,
    position: typeof record.position === 'number' ? record.position : 0,
    urlHost: typeof record.urlHost === 'string' ? record.urlHost : '',
    fetchedAt: typeof record.fetchedAt === 'string' ? record.fetchedAt : null,
    error: typeof record.error === 'string' ? record.error : null,
  }
}

export const parseExternalCalendars = (value: unknown) =>
  parseList(value, parseExternalCalendar).sort((a, b) => a.position - b.position)

export const externalCalendarId = (id: string) => `${EXTERNAL_CALENDAR_PREFIX}${id}`

export const isExternalCalendarId = (calendarId: string) => calendarId.startsWith(EXTERNAL_CALENDAR_PREFIX)

export const isExternalEvent = (event: Pick<CalendarEvent, 'calendarId'>) => isExternalCalendarId(event.calendarId)

export const normalizeCalendarUrl = (value: string) => value.trim().replace(/^webcals?:\/\//i, 'https://')

export const isCalendarUrl = (value: string) => {
  const normalized = normalizeCalendarUrl(value)
  if (normalized.length > EXTERNAL_CALENDAR_URL_MAX_LENGTH || !URL.canParse(normalized)) return false
  const url = new URL(normalized)
  return url.protocol === 'https:' && url.hostname !== '' && !url.username && !url.password
}
