import { encodePathSegment, type ApiClient, type QueryParams } from '../../../utils/api.ts'
import { AppError } from '../../../utils/appError.ts'
import { parseCalendarEvent, type AttendeeStatus, type CalendarEvent, type EventInput } from '../../../utils/event.ts'
import type { EventQuery, EventRepository, EventSearchQuery } from '../types/storage.ts'

const EVENTS_PATH = '/events'

const parseEvents = (values: unknown[]) =>
  values.map(parseCalendarEvent).filter((event): event is CalendarEvent => event !== null)

const parseEvent = (value: unknown) => {
  const event = parseCalendarEvent(value)
  if (!event) throw new AppError('unknown')
  return event
}

export class RemoteEventRepository implements EventRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
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

  async update(id: string, input: EventInput) {
    return parseEvent(await this.#api.put<unknown>(this.#eventPath(id), input))
  }

  async respond(id: string, status: AttendeeStatus) {
    return parseEvent(await this.#api.post<unknown>(`${this.#eventPath(id)}/response`, { status }))
  }

  remove(id: string) {
    return this.#api.delete(this.#eventPath(id))
  }

  async #query(query: QueryParams) {
    return parseEvents(await this.#api.get<unknown[]>(EVENTS_PATH, { query }))
  }

  #eventPath(id: string) {
    return `${EVENTS_PATH}/${encodePathSegment(id)}`
  }
}
