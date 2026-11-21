import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import {
  parseExternalCalendar,
  parseExternalCalendars,
  type ExternalCalendarChanges,
  type ExternalCalendarInput,
} from '../../../utils/externalCalendar.ts'
import type { ExternalCalendarRepository } from '../types/storage.ts'
import { requireValue } from '../../../utils/parse.ts'

const PATH = '/external-calendars'

const parseOne = (value: unknown) => requireValue(parseExternalCalendar(value))

export class RemoteExternalCalendarRepository implements ExternalCalendarRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list() {
    return parseExternalCalendars(await this.#api.get<unknown>(PATH))
  }

  async create(input: ExternalCalendarInput) {
    return parseOne(await this.#api.post<unknown>(PATH, input))
  }

  async update(id: string, changes: ExternalCalendarChanges) {
    return parseOne(await this.#api.patch<unknown>(`${PATH}/${encodePathSegment(id)}`, changes))
  }

  remove(id: string) {
    return this.#api.delete(`${PATH}/${encodePathSegment(id)}`)
  }

  async content(id: string) {
    const text = await this.#api.get<unknown>(`${PATH}/${encodePathSegment(id)}/ics`)
    return typeof text === 'string' ? text : ''
  }
}
