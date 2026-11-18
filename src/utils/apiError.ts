import { isErrorCode, type ErrorCode } from './appError.ts'

export type ApiErrorKind = 'http' | 'timeout' | 'network' | 'aborted' | 'parse'

type ApiErrorOptions = {
  kind: ApiErrorKind
  code?: ErrorCode
  status?: number | null
  body?: unknown
  cause?: unknown
  retryAfter?: number | null
}

const MAX_RETRY_AFTER_SECONDS = 24 * 60 * 60

export const parseRetryAfter = (value: string | null | undefined, now = Date.now()) => {
  const text = value?.trim()
  if (!text) return null
  const seconds = /^\d+$/.test(text) ? Number(text) : Math.ceil((Date.parse(text) - now) / 1000)
  if (!Number.isFinite(seconds)) return null
  return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, seconds))
}

const getServerMessage = (body: unknown) => {
  if (typeof body !== 'object' || body === null) return null
  const message = (body as Record<string, unknown>).message
  return typeof message === 'string' && message.trim() ? message.trim() : null
}

const getServerCode = (body: unknown) => {
  if (typeof body !== 'object' || body === null) return undefined
  const code = (body as Record<string, unknown>).code
  return isErrorCode(code) ? code : undefined
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly body: unknown
  readonly code: ErrorCode | null
  readonly retryAfter: number | null

  constructor(message: string, { kind, code, status = null, body, cause, retryAfter = null }: ApiErrorOptions) {
    super(message, { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.code = code ?? null
    this.status = status
    this.body = body
    this.retryAfter = retryAfter
  }

  get serverMessage() {
    return getServerMessage(this.body)
  }

  static fromResponse(status: number, body: unknown, retryAfter: number | null = null) {
    return new ApiError(getServerMessage(body) ?? `Request failed with status ${status}.`, {
      kind: 'http',
      code: getServerCode(body) ?? (status === 429 ? 'rateLimited' : undefined),
      status,
      body,
      retryAfter,
    })
  }

  static fromKind(kind: Exclude<ApiErrorKind, 'http'>, cause?: unknown) {
    return new ApiError(`Request failed: ${kind}.`, { kind, cause })
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isNotFound() {
    return this.status === 404
  }

  get isServerError() {
    return this.status !== null && this.status >= 500
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError
