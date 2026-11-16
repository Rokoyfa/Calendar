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

const textOrNull = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null)

export const parseEventChange = (value: unknown): EventChange | null => {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (record.type === 'connected' || record.type === 'disconnected') return { type: record.type }
  if (record.type !== 'event.changed') return null
  return {
    type: 'event.changed',
    calendarId: textOrNull(record.calendarId),
    eventId: textOrNull(record.eventId),
    version: Number.isInteger(record.version) && (record.version as number) > 0 ? (record.version as number) : null,
    changedBy: textOrNull(record.changedBy),
  }
}

export const ANY_EVENT_CHANGE: EventChange = {
  type: 'event.changed',
  calendarId: null,
  eventId: null,
  version: null,
  changedBy: null,
}
