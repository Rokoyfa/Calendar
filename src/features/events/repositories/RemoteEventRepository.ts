import { encodePathSegment, type ApiClient, type QueryParams } from '../../../utils/api.ts'
import { parseCalendarEvent, type AttendeeStatus, type EventInput } from '../../../domain/event.ts'
import type { EventQuery, EventRepository, EventSearchQuery } from '../../storage/index.ts'
import { parseTrashedEvents } from '../utils/trash.ts'
import { parseEventChange, type EventChange } from '../../../domain/eventChange.ts'
import type { LiveSocket } from '../../../utils/liveSocket.ts'
import { parseList, requireValue } from '../../../utils/parse.ts'

const EVENTS_PATH = '/events'

const ifMatch = (version: number | undefined): HeadersInit | undefined =>
  version === undefined || version < 1 ? undefined : { 'If-Match': `"${version}"` }

const parseEvents = (values: unknown) => parseList(values, parseCalendarEvent)

const parseEvent = (value: unknown) => requireValue(parseCalendarEvent(value))

export class RemoteEventRepository implements EventRepository {
  readonly #api: ApiClient
  readonly subscribe?: (listener: (change: EventChange) => void) => () => void

  constructor(api: ApiClient, socket?: LiveSocket) {
    this.#api = api
    if (socket)
      this.subscribe = (listener) =>
        socket.subscribe((message) => {
          const change = parseEventChange(message)
          if (change) listener(change)
        })
  }

  list({ from, to, calendarIds }: EventQuery) {
    return this.#query({ from, to, calendarId: calendarIds })
  }

  listSeries(seriesId: string) {
    return this.#query({ seriesId })
  }

  async search({ text, calendarIds }: EventSearchQuery) {
    return parseEvents(
      await this.#api.get<unknown[]>(`${EVENTS_PATH}/search`, { query: { q: text, calendarId: calendarIds } }),
    )
  }

  async create(calendarId: string, input: EventInput) {
    return parseEvent(await this.#api.post<unknown>(EVENTS_PATH, { ...input, calendarId }))
  }

  async update(id: string, input: EventInput, version?: number) {
    return parseEvent(await this.#api.put<unknown>(this.#eventPath(id), input, { headers: ifMatch(version) }))
  }

  async move(id: string, calendarId: string, version?: number) {
    return parseEvent(
      await this.#api.post<unknown>(`${this.#eventPath(id)}/move`, { calendarId }, { headers: ifMatch(version) }),
    )
  }

  async respond(id: string, status: AttendeeStatus) {
    return parseEvent(await this.#api.post<unknown>(`${this.#eventPath(id)}/response`, { status }))
  }

  async setReminders(id: string, reminders: number[]) {
    return parseEvent(await this.#api.put<unknown>(`${this.#eventPath(id)}/reminders`, { reminders }))
  }

  async #query(query: QueryParams) {
    return parseEvents(await this.#api.get<unknown[]>(EVENTS_PATH, { query }))
  }

  async listTrash(calendarId: string) {
    return parseTrashedEvents(await this.#api.get<unknown>(`/calendars/${encodePathSegment(calendarId)}/trash`))
  }

  async restore(id: string) {
    return parseEvent(await this.#api.post<unknown>(`${this.#eventPath(id)}/restore`))
  }

  async emptyTrash(calendarId: string) {
    const result = await this.#api.delete<{ deleted?: unknown } | undefined>(
      `/calendars/${encodePathSegment(calendarId)}/trash`,
    )
    return typeof result?.deleted === 'number' ? result.deleted : 0
  }

  purge(calendarId: string, id: string) {
    return this.#api.delete(`/calendars/${encodePathSegment(calendarId)}/trash/${encodePathSegment(id)}`)
  }

  #eventPath(id: string) {
    return `${EVENTS_PATH}/${encodePathSegment(id)}`
  }

  remove(id: string, version?: number) {
    return this.#api.delete(this.#eventPath(id), { headers: ifMatch(version) })
  }
}
