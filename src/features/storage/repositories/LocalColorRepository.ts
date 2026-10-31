import { isHexColor, normalizeHexColor, type HexColor } from '../../../utils/color.ts'
import type { ColorRepository } from '../types/storage.ts'
import { LocalStorageList } from '../utils/localStorageList.ts'

const DEFAULT_STORAGE_KEY = 'calendar.colors.v1'

const parseColor = (value: unknown) => (isHexColor(value) ? normalizeHexColor(value) : null)

export class LocalColorRepository implements ColorRepository {
  readonly #colors: LocalStorageList<HexColor>

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#colors = new LocalStorageList(storageKey, parseColor, 'Die Farbe konnte nicht lokal gespeichert werden.')
  }

  async list() {
    return [...new Set(this.#colors.read())]
  }

  async add(color: HexColor) {
    const normalized = normalizeHexColor(color)
    const colors = await this.list()
    if (colors.includes(normalized)) return colors
    return this.#colors.update(() => [...colors, normalized])
  }

  async remove(color: HexColor) {
    const normalized = normalizeHexColor(color)
    return this.#colors.update((colors) => colors.filter((entry) => entry !== normalized))
  }
}
