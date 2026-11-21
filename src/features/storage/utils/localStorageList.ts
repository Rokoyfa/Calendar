import type { ErrorCode } from '../../../utils/appError.ts'
import { LocalStorageValue } from './localStorageValue.ts'
import { parseList } from '../../../utils/parse.ts'

export class LocalStorageList<T> extends LocalStorageValue<T[]> {
  constructor(key: string, parseItem: (value: unknown) => T | null, writeError: ErrorCode) {
    super(key, (value) => parseList(value, parseItem), writeError)
  }
}
