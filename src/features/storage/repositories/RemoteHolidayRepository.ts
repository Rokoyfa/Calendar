import type { ApiClient } from '../../../utils/api.ts'
import { parsePublicHolidays } from '../../../utils/holidays.ts'
import type { HolidayQuery, HolidayRepository } from '../types/storage.ts'

export class RemoteHolidayRepository implements HolidayRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list({ from, to, region, language }: HolidayQuery) {
    const query = new URLSearchParams({ from, to, region, lang: language })
    return parsePublicHolidays(await this.#api.get<unknown>(`/holidays?${query}`))
  }
}
