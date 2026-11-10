import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { isHexColor, normalizeHexColor, type HexColor } from '../../../utils/color.ts'
import type { ColorRepository } from '../types/storage.ts'

const COLORS_PATH = '/colors'

const parseColors = (value: unknown): HexColor[] =>
  Array.isArray(value) ? [...new Set(value.filter(isHexColor).map(normalizeHexColor))] : []

export class RemoteColorRepository implements ColorRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list() {
    return parseColors(await this.#api.get<unknown>(COLORS_PATH))
  }

  async add(color: HexColor) {
    return parseColors(await this.#api.post<unknown>(COLORS_PATH, { color: normalizeHexColor(color) }))
  }

  async remove(color: HexColor) {
    const path = `${COLORS_PATH}/${encodePathSegment(normalizeHexColor(color).slice(1))}`
    return parseColors(await this.#api.delete<unknown>(path))
  }
}
