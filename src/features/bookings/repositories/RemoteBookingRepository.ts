import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { AppError } from '../../../utils/appError.ts'
import {
  parseBookingHold,
  parseBookingPage,
  parseBookingPages,
  parseBookingSlots,
  parseBookingSummary,
  parsePublicBookingPage,
  type BookingPageSettings,
  type BookingRequest,
} from '../utils/booking.ts'
import type { DateRange } from '../../../utils/date.ts'
import { requireValue } from '../../../utils/parse.ts'
import type { BookingRepository } from '../../storage/index.ts'

const PAGES_PATH = '/booking-pages'
const PUBLIC_PATH = '/booking'
const BOOKINGS_PATH = '/bookings'

const pagePath = (id: string) => `${PAGES_PATH}/${encodePathSegment(id)}`

const publicPath = (token: string) => `${PUBLIC_PATH}/${encodePathSegment(token)}`

const summaryOf = (value: unknown) => {
  const summary = parseBookingSummary(value)
  if (!summary) throw new AppError('bookingNotFound')
  return summary
}

export class RemoteBookingRepository implements BookingRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async listPages(calendarId: string) {
    return parseBookingPages(await this.#api.get<unknown>(`/calendars/${encodePathSegment(calendarId)}${PAGES_PATH}`))
  }

  async createPage(calendarId: string, settings: BookingPageSettings) {
    return requireValue(
      parseBookingPage(
        await this.#api.post<unknown>(`/calendars/${encodePathSegment(calendarId)}${PAGES_PATH}`, settings),
      ),
    )
  }

  async updatePage(id: string, changes: Partial<BookingPageSettings>) {
    return requireValue(parseBookingPage(await this.#api.patch<unknown>(pagePath(id), changes)))
  }

  async renewPage(id: string) {
    return requireValue(parseBookingPage(await this.#api.post<unknown>(`${pagePath(id)}/renew`)))
  }

  removePage(id: string) {
    return this.#api.delete(pagePath(id))
  }

  async getPublic(token: string) {
    const page = parsePublicBookingPage(await this.#api.get<unknown>(publicPath(token)))
    if (!page) throw new AppError('bookingPageNotFound')
    return page
  }

  async listSlots(token: string, { from, to }: DateRange) {
    return parseBookingSlots(await this.#api.get<unknown>(`${publicPath(token)}/slots`, { query: { from, to } }))
  }

  async book(token: string, request: BookingRequest) {
    return requireValue(parseBookingHold(await this.#api.post<unknown>(publicPath(token), request)))
  }

  async confirm(token: string) {
    return summaryOf(await this.#api.post<unknown>(`${BOOKINGS_PATH}/confirm`, { token }))
  }

  async lookup(token: string) {
    return summaryOf(await this.#api.post<unknown>(`${BOOKINGS_PATH}/lookup`, { token }))
  }

  async cancel(token: string) {
    return summaryOf(await this.#api.post<unknown>(`${BOOKINGS_PATH}/cancel`, { token }))
  }
}
