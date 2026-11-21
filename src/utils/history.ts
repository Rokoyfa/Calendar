import { isOneOf } from './object.ts'
import { asRecord, parseList, textOrNull } from './parse.ts'

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

const parseChange = (value: unknown): HistoryChange | null => {
  const record = asRecord(value)
  if (!isOneOf(HISTORY_FIELDS, record.field)) return null
  return { field: record.field, old: textOrNull(record.old), new: textOrNull(record.new) }
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
    changedBy: typeof author.id === 'string' ? { id: author.id, name: textOrNull(author.name) ?? '' } : null,
    changes: parseList(record.changes, parseChange),
  }
}

export const parseHistoryPage = (value: unknown): HistoryPage => {
  const record = asRecord(value)
  return {
    entries: parseList(record.entries, parseHistoryEntry),
    hasMore: record.hasMore === true,
  }
}
