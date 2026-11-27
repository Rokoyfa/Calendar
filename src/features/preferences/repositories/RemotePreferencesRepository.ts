import type { ApiClient } from '../../../utils/api.ts'
import { parsePreferences, type Preferences } from '../../../domain/preferences.ts'
import type { PreferencesRepository } from '../../storage/index.ts'

const PREFERENCES_PATH = '/preferences'

export class RemotePreferencesRepository implements PreferencesRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async get() {
    return parsePreferences(await this.#api.get<unknown>(PREFERENCES_PATH))
  }

  async update(changes: Partial<Preferences>) {
    return parsePreferences(await this.#api.patch<unknown>(PREFERENCES_PATH, changes))
  }
}
