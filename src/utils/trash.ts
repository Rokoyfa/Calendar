import { parseCalendarEvent, type CalendarEvent } from './event.ts'

export const TRASH_DAYS = 30

export type TrashedEvent = {
  event: CalendarEvent
  deletedAt: string
  deletedBy: string | null
  deletedByName: string | null
  expiresAt: string
  detachedCount: number
}

const text = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null)

export const addTrashDays = (deletedAt: string, days = TRASH_DAYS) =>
  new Date(new Date(deletedAt).getTime() + days * 24 * 60 * 60 * 1000).toISOString()

export const parseTrashedEvent = (value: unknown): TrashedEvent | null => {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const event = parseCalendarEvent(record.event)
  const deletedAt = text(record.deletedAt)
  if (!event || !deletedAt || Number.isNaN(Date.parse(deletedAt))) return null
  return {
    event,
    deletedAt,
    deletedBy: text(record.deletedBy),
    deletedByName: text(record.deletedByName),
    expiresAt: text(record.expiresAt) ?? addTrashDays(deletedAt),
    detachedCount:
      typeof record.detachedCount === 'number' && record.detachedCount > 0 ? Math.floor(record.detachedCount) : 0,
  }
}

export const parseTrashedEvents = (value: unknown) =>
  Array.isArray(value) ? value.map(parseTrashedEvent).filter((entry): entry is TrashedEvent => entry !== null) : []

export const isExpired = (entry: Pick<TrashedEvent, 'expiresAt'>, now = Date.now()) =>
  Date.parse(entry.expiresAt) <= now
