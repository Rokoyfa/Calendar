import { parseCalendarEvent, type CalendarEvent } from './event.ts'
import { filledTextOrNull, parseList } from './parse.ts'

export const TRASH_DAYS = 30

export type TrashedEvent = {
  event: CalendarEvent
  deletedAt: string
  deletedBy: string | null
  deletedByName: string | null
  expiresAt: string
  detachedCount: number
}

export const addTrashDays = (deletedAt: string, days = TRASH_DAYS) =>
  new Date(new Date(deletedAt).getTime() + days * 24 * 60 * 60 * 1000).toISOString()

export const parseTrashedEvent = (value: unknown): TrashedEvent | null => {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const event = parseCalendarEvent(record.event)
  const deletedAt = filledTextOrNull(record.deletedAt)
  if (!event || !deletedAt || Number.isNaN(Date.parse(deletedAt))) return null
  return {
    event,
    deletedAt,
    deletedBy: filledTextOrNull(record.deletedBy),
    deletedByName: filledTextOrNull(record.deletedByName),
    expiresAt: filledTextOrNull(record.expiresAt) ?? addTrashDays(deletedAt),
    detachedCount:
      typeof record.detachedCount === 'number' && record.detachedCount > 0 ? Math.floor(record.detachedCount) : 0,
  }
}

export const parseTrashedEvents = (value: unknown) => parseList(value, parseTrashedEvent)

export const isExpired = (entry: Pick<TrashedEvent, 'expiresAt'>, now = Date.now()) =>
  Date.parse(entry.expiresAt) <= now
