import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { parseHistoryPage } from '../utils/history.ts'
import type { HistoryRepository } from '../../storage/index.ts'

export class RemoteHistoryRepository implements HistoryRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list(eventId: string, { before }: { before?: string } = {}) {
    return parseHistoryPage(
      await this.#api.get<unknown>(`/events/${encodePathSegment(eventId)}/history`, { query: { before } }),
    )
  }
}
