import { isISODate } from './date.ts'
import { isOneOf } from './object.ts'
import { asRecord, parseList, textOrEmpty } from './parse.ts'

export const NOTIFICATION_KINDS = [
  'teamInvitation',
  'eventInvitation',
  'eventChanged',
  'eventCanceled',
  'attendeeResponse',
  'chatMessage',
  'reminder',
  'bookingCreated',
  'bookingCanceled',
] as const

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

export type AppNotification = {
  id: string
  kind: NotificationKind
  actor: { id: string; name: string } | null
  event: { id: string; calendarId: string; title: string; startDate: string; occurrenceDate: string | null } | null
  team: { id: string; name: string } | null
  invitationId: string | null
  createdAt: string
  readAt: string | null
}

export type NotificationPage = { notifications: AppNotification[]; unread: number; hasMore: boolean }

const named = (value: unknown) => {
  const record = asRecord(value)
  return typeof record.id === 'string' ? { id: record.id, name: textOrEmpty(record.name) } : null
}

export const parseNotification = (value: unknown): AppNotification | null => {
  const record = asRecord(value)
  if (
    typeof record.id !== 'string' ||
    !isOneOf(NOTIFICATION_KINDS, record.kind) ||
    typeof record.createdAt !== 'string'
  )
    return null
  const event = asRecord(record.event)
  return {
    id: record.id,
    kind: record.kind,
    actor: named(record.actor),
    event:
      typeof event.id === 'string' && typeof event.calendarId === 'string' && isISODate(event.startDate)
        ? {
            id: event.id,
            calendarId: event.calendarId,
            title: textOrEmpty(event.title),
            startDate: event.startDate,
            occurrenceDate: isISODate(event.occurrenceDate) ? event.occurrenceDate : null,
          }
        : null,
    team: named(record.team),
    invitationId: typeof record.invitationId === 'string' ? record.invitationId : null,
    createdAt: record.createdAt,
    readAt: typeof record.readAt === 'string' ? record.readAt : null,
  }
}

export const parseNotificationPage = (value: unknown): NotificationPage => {
  const record = asRecord(value)
  const notifications = parseList(record.notifications, parseNotification)
  return {
    notifications,
    unread: typeof record.unread === 'number' && record.unread >= 0 ? Math.floor(record.unread) : 0,
    hasMore: record.hasMore === true,
  }
}
