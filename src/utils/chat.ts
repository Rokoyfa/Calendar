import type { EventOccurrence } from './event.ts'

export const CHAT_MESSAGE_MAX_LENGTH = 2000

export type ChatKey = { eventId: string; occurrenceDate: string | null }

export type ChatMessage = ChatKey & {
  id: string
  calendarId: string
  author: { id: string; name: string } | null
  text: string
  createdAt: string
  editedAt: string | null
}

export type ChatPage = { messages: ChatMessage[]; hasMore: boolean }

export type ChatUnread = ChatKey & { count: number }

export type ChatEvent =
  | { type: 'message.created' | 'message.updated'; message: ChatMessage }
  | ({ type: 'message.deleted'; id: string; calendarId: string } & ChatKey)
  | { type: 'connected' }
  | { type: 'disconnected' }

export const getChatKey = (occurrence: EventOccurrence): ChatKey => {
  if (occurrence.seriesId && occurrence.originalDate)
    return { eventId: occurrence.seriesId, occurrenceDate: occurrence.originalDate }
  return { eventId: occurrence.id, occurrenceDate: occurrence.recurrence ? occurrence.occurrenceDate : null }
}

export const getChatId = ({ eventId, occurrenceDate }: ChatKey) => `${eventId}|${occurrenceDate ?? ''}`

export const isSameChat = (a: ChatKey, b: ChatKey) => getChatId(a) === getChatId(b)

const asRecord = (value: unknown) =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

const parseKey = (record: Record<string, unknown>): ChatKey => ({
  eventId: text(record.eventId),
  occurrenceDate: typeof record.occurrenceDate === 'string' && record.occurrenceDate ? record.occurrenceDate : null,
})

export const parseChatMessage = (value: unknown): ChatMessage | null => {
  const record = asRecord(value)
  if (typeof record.id !== 'string' || typeof record.text !== 'string' || typeof record.createdAt !== 'string')
    return null
  const author = asRecord(record.author)
  return {
    ...parseKey(record),
    id: record.id,
    calendarId: text(record.calendarId),
    author: typeof author.id === 'string' ? { id: author.id, name: text(author.name) } : null,
    text: record.text,
    createdAt: record.createdAt,
    editedAt: typeof record.editedAt === 'string' ? record.editedAt : null,
  }
}

const parseMessages = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .map(parseChatMessage)
    .filter((message): message is ChatMessage => message !== null)

export const parseChatPage = (value: unknown): ChatPage => {
  const record = asRecord(value)
  return { messages: parseMessages(record.messages), hasMore: record.hasMore === true }
}

export const parseChatUnread = (value: unknown): ChatUnread[] =>
  (Array.isArray(value) ? value : []).flatMap((entry) => {
    const record = asRecord(entry)
    return typeof record.count === 'number' && record.count > 0 ? [{ ...parseKey(record), count: record.count }] : []
  })

export const parseChatEvent = (value: unknown): ChatEvent | null => {
  const record = asRecord(value)
  if (record.type === 'message.created' || record.type === 'message.updated') {
    const message = parseChatMessage(record.message)
    return message && { type: record.type, message }
  }
  if (record.type === 'message.deleted' && typeof record.id === 'string')
    return { type: 'message.deleted', id: record.id, calendarId: text(record.calendarId), ...parseKey(record) }
  return null
}

export const toSocketUrl = (baseUrl: string, path: string, base = globalThis.location?.href) => {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}${path}`, base)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
