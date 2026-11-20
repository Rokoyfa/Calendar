import { addDaysToISODate } from './date.ts'
import { isEventColor, type CalendarEvent, type EventColor } from './event.ts'
import { asRecord } from './object.ts'

export const CALDAV_CALENDAR_PREFIX = 'caldav:'
export const MAX_CALDAV_ACCOUNTS = 5
export const MAX_APP_PASSWORDS = 20
export const CALDAV_NAME_MAX_LENGTH = 80
export const CALDAV_URL_MAX_LENGTH = 2000
export const CALDAV_USERNAME_MAX_LENGTH = 255
export const CALDAV_PASSWORD_MAX_LENGTH = 500

export type AppPassword = { id: string; name: string; createdAt: string; lastUsedAt: string | null }

export type CreatedAppPassword = AppPassword & { password: string }

export type CaldavAccess = { serverUrl: string; username: string }

export type CaldavCalendar = {
  id: string
  name: string
  color: EventColor
  shown: boolean
  readOnly: boolean
  position: number
  syncedAt: string | null
}

export type CaldavAccount = {
  id: string
  name: string
  serverHost: string
  username: string
  syncedAt: string | null
  syncError: string | null
  calendars: CaldavCalendar[]
}

export type CaldavAccountInput = { name: string; serverUrl: string; username: string; password: string }

export type CaldavAccountChanges = Partial<Pick<CaldavAccountInput, 'name' | 'password'>>

export type CaldavCalendarChanges = Partial<Pick<CaldavCalendar, 'name' | 'color' | 'shown' | 'position'>>

export type CaldavObject = { id: string; etag: string; data: string }

const text = (value: unknown) => (typeof value === 'string' ? value : null)

export const parseAppPassword = (value: unknown): AppPassword | null => {
  const record = asRecord(value)
  const id = text(record.id)
  const name = text(record.name)
  const createdAt = text(record.createdAt)
  if (!id || name === null || !createdAt) return null
  return { id, name, createdAt, lastUsedAt: text(record.lastUsedAt) }
}

export const parseAppPasswords = (value: unknown) =>
  (Array.isArray(value) ? value : []).map(parseAppPassword).filter((entry): entry is AppPassword => entry !== null)

export const parseCreatedAppPassword = (value: unknown): CreatedAppPassword | null => {
  const entry = parseAppPassword(value)
  const password = text(asRecord(value).password)
  return entry && password ? { ...entry, password } : null
}

export const parseCaldavAccess = (value: unknown): CaldavAccess | null => {
  const record = asRecord(value)
  const serverUrl = text(record.serverUrl)
  const username = text(record.username)
  return serverUrl && username ? { serverUrl, username } : null
}

export const parseCaldavCalendar = (value: unknown): CaldavCalendar | null => {
  const record = asRecord(value)
  const id = text(record.id)
  const name = text(record.name)
  if (!id || name === null) return null
  return {
    id,
    name,
    color: isEventColor(record.color) ? record.color : 'blue',
    shown: record.shown !== false,
    readOnly: record.readOnly === true,
    position: typeof record.position === 'number' ? record.position : 0,
    syncedAt: text(record.syncedAt),
  }
}

export const parseCaldavAccount = (value: unknown): CaldavAccount | null => {
  const record = asRecord(value)
  const id = text(record.id)
  const name = text(record.name)
  if (!id || name === null) return null
  return {
    id,
    name,
    serverHost: text(record.serverHost) ?? '',
    username: text(record.username) ?? '',
    syncedAt: text(record.syncedAt),
    syncError: text(record.syncError),
    calendars: (Array.isArray(record.calendars) ? record.calendars : [])
      .map(parseCaldavCalendar)
      .filter((calendar): calendar is CaldavCalendar => calendar !== null)
      .sort((a, b) => a.position - b.position),
  }
}

export const parseCaldavAccounts = (value: unknown) =>
  (Array.isArray(value) ? value : []).map(parseCaldavAccount).filter((entry): entry is CaldavAccount => entry !== null)

export const parseCaldavObject = (value: unknown): CaldavObject | null => {
  const record = asRecord(value)
  const id = text(record.id)
  const etag = text(record.etag)
  const data = text(record.data)
  return id && etag && data !== null ? { id, etag, data } : null
}

export const parseCaldavObjects = (value: unknown) =>
  (Array.isArray(value) ? value : []).map(parseCaldavObject).filter((entry): entry is CaldavObject => entry !== null)

export const isServerUrl = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.length > CALDAV_URL_MAX_LENGTH || !URL.canParse(trimmed)) return false
  const url = new URL(trimmed)
  return url.protocol === 'https:' && url.hostname !== '' && !url.username && !url.password
}

export const caldavCalendarId = (id: string) => `${CALDAV_CALENDAR_PREFIX}${id}`

export const isCaldavCalendarId = (calendarId: string) => calendarId.startsWith(CALDAV_CALENDAR_PREFIX)

export const isCaldavEvent = (event: Pick<CalendarEvent, 'calendarId'>) => isCaldavCalendarId(event.calendarId)

export type CaldavEventRef = { calendarId: string; objectId: string; originalDate: string | null }

export const caldavEventId = (calendarId: string, objectId: string, originalDate: string | null = null) =>
  `${caldavCalendarId(calendarId)}:${objectId}${originalDate ? `:${originalDate}` : ''}`

export const parseCaldavEventId = (id: string): CaldavEventRef | null => {
  if (!isCaldavCalendarId(id)) return null
  const [calendarId, objectId, originalDate = null, ...rest] = id.slice(CALDAV_CALENDAR_PREFIX.length).split(':')
  if (!calendarId || !objectId || rest.length > 0) return null
  return { calendarId, objectId, originalDate }
}

export const isInRange = (event: CalendarEvent, from: string, to: string) =>
  event.recurrence !== null || (event.startDate <= to && addDaysToISODate(event.endDate, 1) >= from)
