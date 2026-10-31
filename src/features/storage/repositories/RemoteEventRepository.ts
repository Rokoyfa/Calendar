import { createApiClient, encodePathSegment, type ApiClient, type QueryParams } from '../../../utils/api.ts'
import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { DateRange, EventRepository } from '../types/storage.ts'

type RemoteEventRepositoryOptions = {
  timeoutMs?: number
  getAccessToken?: () => string | null
}

const EVENTS_PATH = '/events'

export class RemoteEventRepository implements EventRepository {
  readonly #api: ApiClient

  constructor(baseUrl: string, { timeoutMs, getAccessToken }: RemoteEventRepositoryOptions = {}) {
    this.#api = createApiClient({ baseUrl, timeoutMs, getAccessToken })
  }

  list(range: DateRange) {
    return this.#query(range)
  }

  listSeries(seriesId: string) {
    return this.#query({ seriesId })
  }

  create(input: EventInput) {
    return this.#api.post<CalendarEvent>(EVENTS_PATH, input)
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
