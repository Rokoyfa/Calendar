import { filledTextOrNull } from './parse.ts'
export type EventChange =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | {
      type: 'event.changed'
      calendarId: string | null
      eventId: string | null
      version: number | null
      changedBy: string | null
    }

export const parseEventChange = (value: unknown): EventChange | null => {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (record.type === 'connected' || record.type === 'disconnected') return { type: record.type }
  if (record.type !== 'event.changed') return null
  return {
    type: 'event.changed',
    calendarId: filledTextOrNull(record.calendarId),
    eventId: filledTextOrNull(record.eventId),
    version: Number.isInteger(record.version) && (record.version as number) > 0 ? (record.version as number) : null,
    changedBy: filledTextOrNull(record.changedBy),
  }
}

export const ANY_EVENT_CHANGE: EventChange = {
  type: 'event.changed',
  calendarId: null,
  eventId: null,
  version: null,
  changedBy: null,
}
