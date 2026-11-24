import { isISODate, isTime } from './date.ts'
import { ALL_DAY_TIME, isEventColor, NO_SERIES_LINK, type CalendarEvent, type EventColor } from './event.ts'
import { isOneOf } from './object.ts'
import { asRecord, parseList, textOrEmpty } from './parse.ts'
import { parseRecurrence } from './recurrence.ts'
import { isTimeZone } from './timeZone.ts'

export const PEER_CALENDAR_PREFIX = 'peer:'
export const MAX_VIEWERS = 50

const STATUSES = ['pending', 'accepted'] as const

export type ShareStatus = (typeof STATUSES)[number]

export type SharingViewer = {
  id: string
  email: string
  name: string | null
  status: ShareStatus
  invitedAt: string
  expiresAt: string | null
}

export type SharingState = { enabled: boolean; viewers: SharingViewer[] }

export type PeerCalendar = {
  id: string
  ownerName: string
  status: ShareStatus
  color: EventColor
  shown: boolean
  expiresAt: string | null
}

export type PeerCalendarChanges = Partial<Pick<PeerCalendar, 'color' | 'shown'>>

export type PeerEvent = {
  id: string
  title: string
  location: string
  description: string
  busy: boolean
  request: { status: ShareStatus } | null
  event: Pick<
    CalendarEvent,
    | 'startDate'
    | 'start'
    | 'endDate'
    | 'end'
    | 'allDay'
    | 'timeZone'
    | 'recurrence'
    | 'excludedDates'
    | 'seriesId'
    | 'originalDate'
  >
}

export type EventRequestInput = Pick<
  CalendarEvent,
  'title' | 'location' | 'description' | 'startDate' | 'start' | 'endDate' | 'end' | 'allDay' | 'timeZone'
>

const parseViewer = (value: unknown): SharingViewer | null => {
  const record = asRecord(value)
  if (typeof record.id !== 'string' || typeof record.email !== 'string' || !isOneOf(STATUSES, record.status))
    return null
  return {
    id: record.id,
    email: record.email,
    name: typeof record.name === 'string' && record.name !== '' ? record.name : null,
    status: record.status,
    invitedAt: textOrEmpty(record.invitedAt),
    expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : null,
  }
}

export const parseSharingViewer = parseViewer

export const parseSharingState = (value: unknown): SharingState => {
  const record = asRecord(value)
  return { enabled: record.enabled === true, viewers: parseList(record.viewers, parseViewer) }
}

export const parsePeerCalendar = (value: unknown): PeerCalendar | null => {
  const record = asRecord(value)
  if (typeof record.id !== 'string' || !isOneOf(STATUSES, record.status)) return null
  return {
    id: record.id,
    ownerName: textOrEmpty(record.ownerName),
    status: record.status,
    color: isEventColor(record.color) ? record.color : 'green',
    shown: record.shown !== false,
    expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : null,
  }
}

export const parsePeerCalendars = (value: unknown) => parseList(value, parsePeerCalendar)

export const parsePeerEvent = (value: unknown): PeerEvent | null => {
  const record = asRecord(value)
  const allDay = record.allDay === true
  const recurrence = record.recurrence == null ? null : parseRecurrence(record.recurrence)
  const seriesId = typeof record.seriesId === 'string' ? record.seriesId : null
  const originalDate = seriesId !== null && isISODate(record.originalDate) ? record.originalDate : null
  if (
    typeof record.id !== 'string' ||
    !isISODate(record.startDate) ||
    !isISODate(record.endDate) ||
    !isTime(record.start) ||
    !isTime(record.end) ||
    (record.recurrence != null && recurrence === null)
  )
    return null
  const request = asRecord(record.request)
  return {
    id: record.id,
    title: textOrEmpty(record.title),
    location: textOrEmpty(record.location),
    description: textOrEmpty(record.description),
    busy: record.busy !== false,
    request: isOneOf(STATUSES, request.status) ? { status: request.status } : null,
    event: {
      startDate: record.startDate,
      start: allDay ? ALL_DAY_TIME : record.start,
      endDate: record.endDate,
      end: allDay ? ALL_DAY_TIME : record.end,
      allDay,
      timeZone: !allDay && isTimeZone(record.timeZone) ? record.timeZone : null,
      recurrence,
      excludedDates: Array.isArray(record.excludedDates) ? record.excludedDates.filter(isISODate) : [],
      ...(originalDate === null ? NO_SERIES_LINK : { seriesId, originalDate }),
    },
  }
}

export const parsePeerEvents = (value: unknown) => parseList(value, parsePeerEvent)

export const peerCalendarId = (shareId: string) => `${PEER_CALENDAR_PREFIX}${shareId}`

export const isPeerCalendarId = (id: string) => id.startsWith(PEER_CALENDAR_PREFIX)

export const isPeerEvent = (event: Pick<CalendarEvent, 'calendarId'>) => isPeerCalendarId(event.calendarId)

export const peerEventId = (shareId: string, eventId: string) => `${peerCalendarId(shareId)}:${eventId}`

export const parsePeerEventId = (id: string) => {
  if (!isPeerCalendarId(id)) return null
  const [shareId, eventId, ...rest] = id.slice(PEER_CALENDAR_PREFIX.length).split(':')
  return shareId && eventId && rest.length === 0 ? { shareId, eventId } : null
}

export const shareIdOf = (calendarId: string) =>
  isPeerCalendarId(calendarId) ? calendarId.slice(PEER_CALENDAR_PREFIX.length) : null

export const toPeerCalendarEvent = (calendar: PeerCalendar, peer: PeerEvent, busyTitle: string): CalendarEvent => {
  const id = peerEventId(calendar.id, peer.id)
  return {
    ...peer.event,
    seriesId: peer.event.seriesId === null ? null : peerEventId(calendar.id, peer.event.seriesId),
    id,
    calendarId: peerCalendarId(calendar.id),
    uid: id,
    title: peer.busy ? busyTitle : peer.title,
    location: peer.location,
    description: peer.description,
    links: [],
    categoryIds: [],
    color: calendar.color,
    reminders: [],
    attendees: [],
    visibility: 'private',
    request: peer.request ? { status: peer.request.status, requester: null, mine: true } : null,
    attachmentCount: 0,
    version: 1,
    createdBy: null,
    createdAt: '',
    updatedAt: '',
  }
}

export const toEventRequestInput = (input: EventRequestInput): EventRequestInput => ({
  title: input.title,
  location: input.location,
  description: input.description,
  startDate: input.startDate,
  start: input.start,
  endDate: input.endDate,
  end: input.end,
  allDay: input.allDay,
  timeZone: input.timeZone,
})

export const isOwnPendingRequest = (event: Pick<CalendarEvent, 'calendarId' | 'request'>) =>
  isPeerEvent(event) && event.request?.mine === true && event.request.status === 'pending'

export const isOwnRequest = (event: Pick<CalendarEvent, 'calendarId' | 'request'>) =>
  isPeerEvent(event) && event.request?.mine === true
