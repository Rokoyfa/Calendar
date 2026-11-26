import type { ApiClient } from '../../../utils/api.ts'
import type { FreeBusyQuery, FreeBusyRepository } from '../types/freeBusy.ts'
import { parseFreeBusy } from '../utils/freeBusy.ts'

export class RemoteFreeBusyRepository implements FreeBusyRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async lookup({ from, to, emails, excludeEventId }: FreeBusyQuery) {
    if (emails.length === 0) return []
    const body = {
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
      attendees: emails.map((email) => ({ email })),
      excludeEventId,
    }
    return parseFreeBusy(await this.#api.post<unknown>('/free-busy', body))
  }
}
