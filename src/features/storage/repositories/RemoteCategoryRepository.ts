import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { parseCategories, parseCategory } from '../../../utils/category.ts'
import type { CategoryRepository } from '../types/storage.ts'
import { requireValue } from '../../../utils/parse.ts'

const CATEGORIES_PATH = '/categories'

const toCategory = (value: unknown) => requireValue(parseCategory(value))

export class RemoteCategoryRepository implements CategoryRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list(calendarIds: readonly string[]) {
    if (calendarIds.length === 0) return []
    return parseCategories(await this.#api.get<unknown>(CATEGORIES_PATH, { query: { calendarId: calendarIds } }))
  }

  async create(calendarId: string, name: string) {
    return toCategory(
      await this.#api.post<unknown>(`/calendars/${encodePathSegment(calendarId)}${CATEGORIES_PATH}`, { name }),
    )
  }

  async rename(id: string, name: string) {
    return toCategory(await this.#api.patch<unknown>(`${CATEGORIES_PATH}/${encodePathSegment(id)}`, { name }))
  }

  remove(id: string) {
    return this.#api.delete(`${CATEGORIES_PATH}/${encodePathSegment(id)}`)
  }
}
