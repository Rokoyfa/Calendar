import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import {
  parseChatEvent,
  parseChatMessage,
  parseChatPage,
  parseChatUnread,
  type ChatEvent,
  type ChatKey,
  type ChatMessage,
} from '../../../utils/chat.ts'
import { AppError } from '../../../utils/appError.ts'
import type { ChatRepository } from '../types/storage.ts'

const RETRY_MIN_MS = 1000
const RETRY_MAX_MS = 30_000
const PING_INTERVAL_MS = 25_000

type Listener = (event: ChatEvent) => void

class ChatSocket {
  readonly #url: string
  readonly #listeners = new Set<Listener>()
  #socket: WebSocket | null = null
  #retryMs = RETRY_MIN_MS
  #retryTimer: ReturnType<typeof setTimeout> | null = null
  #pingTimer: ReturnType<typeof setInterval> | null = null

  constructor(url: string) {
    this.#url = url
  }

  subscribe(listener: Listener) {
    this.#listeners.add(listener)
    if (this.#listeners.size === 1) this.#connect()
    return () => {
      this.#listeners.delete(listener)
      if (this.#listeners.size === 0) this.#close()
    }
  }

  #emit(event: ChatEvent) {
    for (const listener of this.#listeners) listener(event)
  }

  #connect() {
    if (typeof WebSocket === 'undefined' || this.#socket) return
    const socket = new WebSocket(this.#url)
    this.#socket = socket
    socket.addEventListener('open', () => {
      if (this.#socket !== socket) return
      this.#retryMs = RETRY_MIN_MS
      this.#pingTimer = setInterval(() => socket.send('{"type":"ping"}'), PING_INTERVAL_MS)
      this.#emit({ type: 'connected' })
    })
    socket.addEventListener('message', ({ data }) => {
      if (this.#socket !== socket) return
      try {
        const event = parseChatEvent(JSON.parse(String(data)))
        if (event) this.#emit(event)
      } catch {
        return
      }
    })
    socket.addEventListener('close', () => {
      if (this.#socket !== socket) return
      this.#stopPing()
      this.#socket = null
      if (this.#listeners.size === 0) return
      this.#emit({ type: 'disconnected' })
      this.#retryTimer = setTimeout(() => this.#connect(), this.#retryMs)
      this.#retryMs = Math.min(this.#retryMs * 2, RETRY_MAX_MS)
    })
  }

  #stopPing() {
    if (this.#pingTimer) clearInterval(this.#pingTimer)
    this.#pingTimer = null
  }

  #close() {
    if (this.#retryTimer) clearTimeout(this.#retryTimer)
    this.#retryTimer = null
    this.#stopPing()
    this.#socket?.close()
    this.#socket = null
  }
}

const parseMessage = (value: unknown): ChatMessage => {
  const message = parseChatMessage(value)
  if (!message) throw new AppError('unknown')
  return message
}

export class RemoteChatRepository implements ChatRepository {
  readonly #api: ApiClient
  readonly #socket: ChatSocket

  constructor(api: ApiClient, socketUrl: string) {
    this.#api = api
    this.#socket = new ChatSocket(socketUrl)
  }

  async list(key: ChatKey, { before }: { before?: string } = {}) {
    return parseChatPage(
      await this.#api.get<unknown>(this.#chatPath(key), { query: { date: key.occurrenceDate, before } }),
    )
  }

  async send(key: ChatKey, text: string) {
    return parseMessage(
      await this.#api.post<unknown>(this.#chatPath(key), { text }, { query: { date: key.occurrenceDate } }),
    )
  }

  async edit(id: string, text: string) {
    return parseMessage(await this.#api.patch<unknown>(this.#messagePath(id), { text }))
  }

  remove(id: string) {
    return this.#api.delete(this.#messagePath(id))
  }

  async markRead(key: ChatKey) {
    await this.#api.post<void>(`${this.#chatPath(key)}/read`, undefined, { query: { date: key.occurrenceDate } })
  }

  async unread(calendarIds: readonly string[]) {
    return parseChatUnread(await this.#api.get<unknown>('/chat/unread', { query: { calendarId: calendarIds } }))
  }

  subscribe(listener: Listener) {
    return this.#socket.subscribe(listener)
  }

  #chatPath({ eventId }: ChatKey) {
    return `/events/${encodePathSegment(eventId)}/chat`
  }

  #messagePath(id: string) {
    return `/chat/messages/${encodePathSegment(id)}`
  }
}
