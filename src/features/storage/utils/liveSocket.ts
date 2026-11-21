import { isRecord } from '../../../utils/parse.ts'
const RETRY_MIN_MS = 1000
const RETRY_MAX_MS = 30_000
const PING_INTERVAL_MS = 25_000
const MAX_FAILED_STARTS = 5

export type LiveMessage = Record<string, unknown> & { type: string }
type Listener = (message: LiveMessage) => void

const isMessage = (value: unknown): value is LiveMessage => isRecord(value) && typeof value.type === 'string'

export class LiveSocket {
  readonly #url: string
  readonly #listeners = new Set<Listener>()
  #socket: WebSocket | null = null
  #retryMs = RETRY_MIN_MS
  #hasConnected = false
  #failedStarts = 0
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

  #emit(message: LiveMessage) {
    for (const listener of [...this.#listeners]) listener(message)
  }

  #connect() {
    if (typeof WebSocket === 'undefined' || this.#socket) return
    const socket = new WebSocket(this.#url)
    this.#socket = socket
    socket.addEventListener('open', () => {
      if (this.#socket !== socket) return
      this.#retryMs = RETRY_MIN_MS
      this.#hasConnected = true
      this.#failedStarts = 0
      this.#pingTimer = setInterval(() => socket.send('{"type":"ping"}'), PING_INTERVAL_MS)
      this.#emit({ type: 'connected' })
    })
    socket.addEventListener('message', ({ data }) => {
      if (this.#socket !== socket) return
      try {
        const message: unknown = JSON.parse(String(data))
        if (isMessage(message)) this.#emit(message)
      } catch {
        return
      }
    })
    socket.addEventListener('close', () => {
      if (this.#socket !== socket) return
      this.#stopPing()
      this.#socket = null
      if (this.#listeners.size === 0) return
      if (!this.#hasConnected && ++this.#failedStarts >= MAX_FAILED_STARTS) return
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
    this.#failedStarts = 0
    if (this.#retryTimer) clearTimeout(this.#retryTimer)
    this.#retryTimer = null
    this.#stopPing()
    this.#socket?.close()
    this.#socket = null
  }
}
