export class LocalStorageList<T> {
  readonly #key: string
  readonly #parse: (value: unknown) => T | null
  readonly #writeError: string

  constructor(key: string, parse: (value: unknown) => T | null, writeError: string) {
    this.#key = key
    this.#parse = parse
    this.#writeError = writeError
  }

  read(): T[] {
    try {
      const raw = localStorage.getItem(this.#key)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.map(this.#parse).filter((item): item is T => item !== null) : []
    } catch {
      return []
    }
  }

  write(items: readonly T[]) {
    try {
      localStorage.setItem(this.#key, JSON.stringify(items))
    } catch {
      throw new Error(this.#writeError)
    }
  }

  update(change: (items: T[]) => T[]) {
    const next = change(this.read())
    this.write(next)
    return next
  }
}
