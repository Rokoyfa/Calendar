import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { AppError } from '../../../utils/appError.ts'
import { parseAppPasswords, parseCaldavAccess, parseCreatedAppPassword } from '../../../utils/caldav.ts'
import type { AppPasswordRepository } from '../types/storage.ts'

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
    const created = parseCreatedAppPassword(await this.#api.post<unknown>(PATH, { name }))
    if (!created) throw new AppError('unknown')
    return created
  }

  remove(id: string) {
    return this.#api.delete(`${PATH}/${encodePathSegment(id)}`)
  }

  async access() {
    const access = parseCaldavAccess(await this.#api.get<unknown>('/caldav'))
    if (!access) throw new AppError('unknown')
    return access
  }
}
