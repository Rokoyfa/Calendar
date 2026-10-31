import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { DateRange, EventRepository } from '../types/storage.ts'

const DEFAULT_TIMEOUT_MS = 10_000

type RemoteEventRepositoryOptions = {
  timeoutMs?: number
  getAccessToken?: () => string | null
}

export class RemoteEventRepository implements EventRepository {
  readonly #baseUrl: string
  readonly #timeoutMs: number
  readonly #getAccessToken: () => string | null

  constructor(
    baseUrl: string,
    { timeoutMs = DEFAULT_TIMEOUT_MS, getAccessToken = () => null }: RemoteEventRepositoryOptions = {},
  ) {
    this.#baseUrl = baseUrl.replace(/\/+$/, '')
    this.#timeoutMs = timeoutMs
    this.#getAccessToken = getAccessToken
  }

  list(range: DateRange) {
    return this.#query(range)
  }

  listSeries(seriesId: string) {
    return this.#query({ seriesId })
  }

  create(input: EventInput) {
    return this.#request<CalendarEvent>('/events', { method: 'POST', body: JSON.stringify(input) })
  }

  update(id: string, input: EventInput) {
    return this.#request<CalendarEvent>(this.#eventPath(id), { method: 'PUT', body: JSON.stringify(input) })
  }

  async remove(id: string) {
    await this.#request<void>(this.#eventPath(id), { method: 'DELETE' })
  }

  #query(params: Record<string, string>) {
    return this.#request<CalendarEvent[]>(`/events?${new URLSearchParams(params)}`)
  }

  #eventPath(id: string) {
    return `/events/${encodeURIComponent(id)}`
  }

  async #request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.#getAccessToken()
    let response: Response

    try {
      response = await fetch(`${this.#baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(this.#timeoutMs),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      })
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === 'TimeoutError'
      const message = isTimeout ? 'Der Server hat nicht rechtzeitig geantwortet.' : 'Der Server ist nicht erreichbar.'
      throw new Error(message, { cause: error })
    }

    if (!response.ok) throw new Error(`Die Anfrage an den Server ist fehlgeschlagen (${response.status}).`)
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }
}
