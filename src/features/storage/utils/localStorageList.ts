import { LocalStorageValue } from './localStorageValue.ts'

export class LocalStorageList<T> extends LocalStorageValue<T[]> {
  constructor(key: string, parseItem: (value: unknown) => T | null, writeError: string) {
    super(
      key,
      (value) => (Array.isArray(value) ? value.map(parseItem).filter((item): item is T => item !== null) : []),
      writeError,
    )
  }
}
