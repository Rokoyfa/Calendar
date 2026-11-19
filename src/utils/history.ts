import { asRecord, isOneOf } from './object.ts'

export const HISTORY_ACTIONS = ['created', 'updated', 'moved', 'deleted', 'restored'] as const

export type HistoryAction = (typeof HISTORY_ACTIONS)[number]

export const HISTORY_FIELDS = [
  'title',
  'location',
  'description',
  'start',
  'end',
  'allDay',
  'timeZone',
  'color',
  'calendar',
  'recurrence',
  'attendees',
  'links',
  'categories',
] as const

export type HistoryField = (typeof HISTORY_FIELDS)[number]

export type HistoryChange = { field: HistoryField; old: string | null; new: string | null }

export type HistoryEntry = {
  id: string
  action: HistoryAction
  changedAt: string
  changedBy: { id: string; name: string } | null
  changes: HistoryChange[]
}

export type HistoryPage = { entries: HistoryEntry[]; hasMore: boolean }

const optionalText = (value: unknown) => (typeof value === 'string' ? value : null)

const parseChange = (value: unknown): HistoryChange | null => {
  const record = asRecord(value)
  if (!isOneOf(HISTORY_FIELDS, record.field)) return null
  return { field: record.field, old: optionalText(record.old), new: optionalText(record.new) }
}

export const parseHistoryEntry = (value: unknown): HistoryEntry | null => {
  const record = asRecord(value)
  if (typeof record.id !== 'string' || !isOneOf(HISTORY_ACTIONS, record.action) || typeof record.changedAt !== 'string')
    return null
  const author = asRecord(record.changedBy)
  return {
    id: record.id,
    action: record.action,
    changedAt: record.changedAt,
    changedBy: typeof author.id === 'string' ? { id: author.id, name: optionalText(author.name) ?? '' } : null,
    changes: (Array.isArray(record.changes) ? record.changes : [])
      .map(parseChange)
      .filter((change): change is HistoryChange => change !== null),
  }
}

export const parseHistoryPage = (value: unknown): HistoryPage => {
  const record = asRecord(value)
  return {
    entries: (Array.isArray(record.entries) ? record.entries : [])
      .map(parseHistoryEntry)
      .filter((entry): entry is HistoryEntry => entry !== null),
    hasMore: record.hasMore === true,
  }
}
