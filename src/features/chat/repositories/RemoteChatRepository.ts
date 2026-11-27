import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import {
  parseChatEvent,
  parseChatMessage,
  parseChatPage,
  parseChatUnread,
  type ChatEvent,
  type ChatKey,
  type ChatMessage,
} from '../utils/chat.ts'
import type { ChatRepository } from '../../storage/index.ts'
import { LiveSocket } from '../../../utils/liveSocket.ts'
import { requireValue } from '../../../utils/parse.ts'

type Listener = (event: ChatEvent) => void

const parseMessage = (value: unknown): ChatMessage => requireValue(parseChatMessage(value))

export class RemoteChatRepository implements ChatRepository {
  readonly #api: ApiClient
  readonly #socket: LiveSocket

  constructor(api: ApiClient, socket: LiveSocket | string) {
    this.#api = api
    this.#socket = typeof socket === 'string' ? new LiveSocket(socket) : socket
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
    return this.#socket.subscribe((message) => {
      if (message.type === 'connected' || message.type === 'disconnected') listener({ type: message.type })
      else {
        const event = parseChatEvent(message)
        if (event) listener(event)
      }
    })
  }

  #chatPath({ eventId }: ChatKey) {
    return `/events/${encodePathSegment(eventId)}/chat`
  }

  #messagePath(id: string) {
    return `/chat/messages/${encodePathSegment(id)}`
  }
}
