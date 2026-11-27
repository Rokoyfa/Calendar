import type { ErrorCode } from './appError.ts'
import { LocalStorageValue } from './localStorageValue.ts'
import { parseList } from './parse.ts'

export class LocalStorageList<T> extends LocalStorageValue<T[]> {
  constructor(key: string, parseItem: (value: unknown) => T | null, writeError: ErrorCode) {
    super(key, (value) => parseList(value, parseItem), writeError)
  }
}
