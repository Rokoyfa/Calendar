import { filledTextOrNull } from '../utils/parse.ts'
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
  if (record.type !== 'event.changed' && record.type !== 'task.changed') return null
  return {
    type: 'event.changed',
    calendarId: filledTextOrNull(record.calendarId),
    eventId: record.type === 'event.changed' ? filledTextOrNull(record.eventId) : null,
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
