import { parsePreferences, type Preferences } from '../../../utils/preferences.ts'
import type { PreferencesRepository } from '../types/storage.ts'
import { LocalStorageValue } from '../utils/localStorageValue.ts'

const DEFAULT_STORAGE_KEY = 'calendar.preferences.v1'

export class LocalPreferencesRepository implements PreferencesRepository {
  readonly #preferences: LocalStorageValue<Preferences>

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#preferences = new LocalStorageValue(
      storageKey,
      parsePreferences,
      'savePreferencesFailed',
    )
    this.#preferences.initialize()
  }

  async get() {
    return this.#preferences.read()
  }

  async update(changes: Partial<Preferences>) {
    return this.#preferences.update((current) => ({ ...current, ...changes }))
  }
}
