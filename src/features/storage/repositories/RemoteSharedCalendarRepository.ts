import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { AppError } from '../../../utils/appError.ts'
import type { DateRange } from '../../../utils/date.ts'
import { parseCalendarEvent } from '../../../utils/event.ts'
import { parseSharedCalendar, SHARED_PATH } from '../../../utils/sharedCalendar.ts'
import type { SharedCalendarRepository } from '../types/storage.ts'

export class RemoteSharedCalendarRepository implements SharedCalendarRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async get(token: string) {
    const calendar = parseSharedCalendar(await this.#api.get<unknown>(`${SHARED_PATH}/${encodePathSegment(token)}`))
    if (!calendar) throw new AppError('shareNotFound')
    return calendar
  }

  async listEvents(token: string, { from, to }: DateRange) {
    const events = await this.#api.get<unknown[]>(`${SHARED_PATH}/${encodePathSegment(token)}/events`, {
      query: { from, to },
    })
    return Array.isArray(events) ? events.flatMap((event) => parseCalendarEvent(event) ?? []) : []
  }
}
