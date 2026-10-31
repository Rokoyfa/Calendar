import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { DateRange, EventRepository } from '../types/storage.ts'

export class RemoteEventRepository implements EventRepository {
  readonly #baseUrl: string
  readonly #getAccessToken: () => string | null

  constructor(baseUrl: string, getAccessToken: () => string | null = () => null) {
    this.#baseUrl = baseUrl.replace(/\/+$/, '')
    this.#getAccessToken = getAccessToken
  }

  list(range: DateRange) {
    return this.#request<CalendarEvent[]>(`/events?${new URLSearchParams(range)}`)
  }

  listSeries(seriesId: string) {
    return this.#request<CalendarEvent[]>(`/events?${new URLSearchParams({ seriesId })}`)
  }

  create(input: EventInput) {
    return this.#request<CalendarEvent>('/events', { method: 'POST', body: JSON.stringify(input) })
  }

  update(id: string, input: EventInput) {
    return this.#request<CalendarEvent>(`/events/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }

  async remove(id: string) {
    await this.#request<void>(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async #request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.#getAccessToken()
    const response = await fetch(`${this.#baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })

    if (!response.ok) throw new Error(`Die Anfrage an den Server ist fehlgeschlagen (${response.status}).`)
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }
}
