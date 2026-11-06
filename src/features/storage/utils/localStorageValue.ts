import { AppError, type ErrorCode } from '../../../utils/appError.ts'

export class LocalStorageValue<T> {
  readonly #key: string
  readonly #parse: (value: unknown) => T
  readonly #writeError: ErrorCode

  constructor(key: string, parse: (value: unknown) => T, writeError: ErrorCode) {
    this.#key = key
    this.#parse = parse
    this.#writeError = writeError
  }

  initialize() {
    try {
      if (localStorage.getItem(this.#key) === null) localStorage.setItem(this.#key, JSON.stringify(this.#parse(null)))
    } catch {
      return
    }
  }

  read(): T {
    try {
      const raw = localStorage.getItem(this.#key)
      return this.#parse(raw ? JSON.parse(raw) : null)
    } catch {
      return this.#parse(null)
    }
  }

  write(value: T) {
    try {
      localStorage.setItem(this.#key, JSON.stringify(value))
    } catch {
      throw new AppError(this.#writeError)
    }
  }

  update(change: (value: T) => T) {
    const next = change(this.read())
    this.write(next)
    return next
  }
}
