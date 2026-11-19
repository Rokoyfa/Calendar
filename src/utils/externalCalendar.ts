import { isEventColor, type CalendarEvent, type EventColor } from './event.ts'
import { parseICalendar } from './ical.ts'
import { asRecord } from './object.ts'

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
  (Array.isArray(value) ? value : [])
    .map(parseExternalCalendar)
    .filter((calendar): calendar is ExternalCalendar => calendar !== null)
    .sort((a, b) => a.position - b.position)

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

export const toExternalEvents = (calendar: ExternalCalendar, text: string): CalendarEvent[] => {
  const parsed = parseICalendar(text)
  if (!parsed) return []
  const calendarId = externalCalendarId(calendar.id)
  const prefix = `${calendarId}:`
  const series = new Map<string, string>()
  const events: CalendarEvent[] = []
  parsed.events.forEach(({ input, recurrenceId }, index) => {
    const id = `${prefix}${index}`
    if (input.recurrence && !series.has(input.uid)) series.set(input.uid, id)
    events.push({
      ...input,
      id,
      calendarId,
      color: calendar.color,
      categoryIds: [],
      reminders: [],
      seriesId: recurrenceId,
      originalDate: recurrenceId,
      attachmentCount: 0,
      version: 1,
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    })
  })
  const linked = events.map((event) => {
    if (event.seriesId === null) return event
    const seriesId = series.get(event.uid)
    return seriesId ? { ...event, seriesId } : { ...event, seriesId: null, originalDate: null }
  })
  const exclusions = new Map<string, string[]>()
  for (const { seriesId, originalDate } of linked)
    if (seriesId && originalDate) exclusions.set(seriesId, [...(exclusions.get(seriesId) ?? []), originalDate])
  return linked.map((event) => {
    const excluded = exclusions.get(event.id)
    return excluded ? { ...event, excludedDates: [...new Set([...event.excludedDates, ...excluded])].sort() } : event
  })
}
