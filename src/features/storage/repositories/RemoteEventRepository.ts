import { encodePathSegment, type ApiClient, type QueryParams } from '../../../utils/api.ts'
import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { EventQuery, EventRepository } from '../types/storage.ts'

const EVENTS_PATH = '/events'

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

  create(calendarId: string, input: EventInput) {
    return this.#api.post<CalendarEvent>(EVENTS_PATH, { ...input, calendarId })
  }

  update(id: string, input: EventInput) {
    return this.#api.put<CalendarEvent>(this.#eventPath(id), input)
  }

  remove(id: string) {
    return this.#api.delete(this.#eventPath(id))
  }

  #query(query: QueryParams) {
    return this.#api.get<CalendarEvent[]>(EVENTS_PATH, { query })
  }

  #eventPath(id: string) {
    return `${EVENTS_PATH}/${encodePathSegment(id)}`
  }
}
