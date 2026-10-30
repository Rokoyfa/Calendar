import { isHexColor, normalizeHexColor, type HexColor } from '../../../utils/color.ts'
import type { ColorRepository } from '../types/storage.ts'

const DEFAULT_STORAGE_KEY = 'calendar.colors.v1'

export class LocalColorRepository implements ColorRepository {
  readonly #storageKey: string

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#storageKey = storageKey
  }

  async list() {
    return this.#read()
  }

  async add(color: HexColor) {
    const normalized = normalizeHexColor(color)
    const colors = this.#read()
    if (colors.includes(normalized)) return colors

    const next = [...colors, normalized]
    this.#write(next)
    return next
  }

  async remove(color: HexColor) {
    const normalized = normalizeHexColor(color)
    const next = this.#read().filter((entry) => entry !== normalized)
    this.#write(next)
    return next
  }

  #read(): HexColor[] {
    try {
      const raw = localStorage.getItem(this.#storageKey)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? [...new Set(parsed.filter(isHexColor).map(normalizeHexColor))] : []
    } catch {
      return []
    }
  }

  #write(colors: HexColor[]) {
    try {
      localStorage.setItem(this.#storageKey, JSON.stringify(colors))
    } catch {
      throw new Error('Die Farbe konnte nicht lokal gespeichert werden.')
    }
  }
}
