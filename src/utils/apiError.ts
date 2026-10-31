export type ApiErrorKind = 'http' | 'timeout' | 'network' | 'aborted' | 'parse'

type ApiErrorOptions = {
  kind: ApiErrorKind
  status?: number | null
  body?: unknown
  cause?: unknown
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was invalid.',
  401: 'Please log in.',
  403: 'You are not authorized to perform this action.',
  404: 'The item was not found.',
  409: 'The item has been modified. Please reload.',
  413: 'The data is too large.',
  422: 'The inputs are invalid.',
  429: 'Too many requests. Please wait a moment.',
}

const KIND_MESSAGES: Record<Exclude<ApiErrorKind, 'http'>, string> = {
  timeout: 'The server did not respond in time.',
  network: 'The server is not reachable.',
  aborted: 'The request was aborted.',
  parse: 'The server response could not be parsed.',
}

const getStatusMessage = (status: number) =>
  STATUS_MESSAGES[status] ??
  (status >= 500 ? 'An error occurred on the server.' : `The request failed (${status}).`)

const getServerMessage = (body: unknown) => {
  if (typeof body !== 'object' || body === null) return null
  const message = (body as Record<string, unknown>).message
  return typeof message === 'string' && message.trim() ? message.trim() : null
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly body: unknown

  constructor(message: string, { kind, status = null, body, cause }: ApiErrorOptions) {
    super(message, { cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.body = body
  }

  static fromResponse(status: number, body: unknown) {
    return new ApiError(getServerMessage(body) ?? getStatusMessage(status), { kind: 'http', status, body })
  }

  static fromKind(kind: Exclude<ApiErrorKind, 'http'>, cause?: unknown) {
    return new ApiError(KIND_MESSAGES[kind], { kind, cause })
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
