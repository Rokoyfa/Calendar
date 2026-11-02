export type ApiErrorKind = 'http' | 'timeout' | 'network' | 'aborted' | 'parse'

type ApiErrorOptions = {
  kind: ApiErrorKind
  status?: number | null
  body?: unknown
  cause?: unknown
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Die Anfrage war ungültig.',
  401: 'Bitte melde dich an.',
  403: 'Dafür fehlt dir die Berechtigung.',
  404: 'Der Eintrag wurde nicht gefunden.',
  409: 'Der Eintrag wurde inzwischen geändert. Bitte neu laden.',
  413: 'Die Daten sind zu groß.',
  422: 'Die Eingaben sind ungültig.',
  429: 'Zu viele Anfragen. Bitte kurz warten.',
}

const KIND_MESSAGES: Record<Exclude<ApiErrorKind, 'http'>, string> = {
  timeout: 'Der Server hat nicht rechtzeitig geantwortet.',
  network: 'Der Server ist nicht erreichbar.',
  aborted: 'Die Anfrage wurde abgebrochen.',
  parse: 'Die Antwort des Servers konnte nicht gelesen werden.',
}

const getStatusMessage = (status: number) =>
  STATUS_MESSAGES[status] ??
  (status >= 500 ? 'Auf dem Server ist ein Fehler aufgetreten.' : `Die Anfrage ist fehlgeschlagen (${status}).`)

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
