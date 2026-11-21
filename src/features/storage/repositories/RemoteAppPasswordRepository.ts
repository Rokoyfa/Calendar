import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { parseAppPasswords, parseCaldavAccess, parseCreatedAppPassword } from '../../../utils/caldav.ts'
import type { AppPasswordRepository } from '../types/storage.ts'
import { requireValue } from '../../../utils/parse.ts'

const PATH = '/auth/app-passwords'

export class RemoteAppPasswordRepository implements AppPasswordRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list() {
    return parseAppPasswords(await this.#api.get<unknown>(PATH))
  }

  async create(name: string) {
    return requireValue(parseCreatedAppPassword(await this.#api.post<unknown>(PATH, { name })))
  }

  remove(id: string) {
    return this.#api.delete(`${PATH}/${encodePathSegment(id)}`)
  }

  async access() {
    return requireValue(parseCaldavAccess(await this.#api.get<unknown>('/caldav')))
  }
}
