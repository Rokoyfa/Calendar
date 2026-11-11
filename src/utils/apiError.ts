import { isErrorCode, type ErrorCode } from './appError.ts'

export type ApiErrorKind = 'http' | 'timeout' | 'network' | 'aborted' | 'parse'

type ApiErrorOptions = {
  kind: ApiErrorKind
  code?: ErrorCode
  status?: number | null
  body?: unknown
  cause?: unknown
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

  constructor(message: string, { kind, code, status = null, body, cause }: ApiErrorOptions) {
    super(message, { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.code = code ?? null
    this.status = status
    this.body = body
  }

  get serverMessage() {
    return getServerMessage(this.body)
  }

  static fromResponse(status: number, body: unknown) {
    return new ApiError(getServerMessage(body) ?? `Request failed with status ${status}.`, {
      kind: 'http',
      code: getServerCode(body),
      status,
      body,
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
