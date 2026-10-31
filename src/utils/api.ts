import { ApiError } from './apiError.ts'

export type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiRequestOptions = {
  query?: QueryParams
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  timeoutMs?: number
}

export type ApiClientOptions = {
  baseUrl: string
  timeoutMs?: number
  credentials?: RequestCredentials
  headers?: HeadersInit
  getAccessToken?: () => string | null
  onUnauthorized?: (error: ApiError) => void
}

export type ApiClient = {
  request<T>(method: HttpMethod, path: string, options?: ApiRequestOptions): Promise<T>
  get<T>(path: string, options?: Omit<ApiRequestOptions, 'body'>): Promise<T>
  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>): Promise<T>
  put<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>): Promise<T>
  patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>): Promise<T>
  delete<T = void>(path: string, options?: Omit<ApiRequestOptions, 'body'>): Promise<T>
}

const DEFAULT_TIMEOUT_MS = 10_000
const EMPTY_STATUSES = new Set([204, 205])

const isRawBody = (body: unknown): body is BodyInit =>
  body instanceof FormData ||
  body instanceof Blob ||
  body instanceof URLSearchParams ||
  body instanceof ArrayBuffer ||
  typeof body === 'string'

export const buildQueryString = (query: QueryParams = {}) => {
  const params = new URLSearchParams()
  for (const [key, raw] of Object.entries(query)) {
    const values: readonly QueryValue[] = Array.isArray(raw) ? raw : [raw as QueryValue]
    for (const value of values) if (value !== null && value !== undefined) params.append(key, String(value))
  }
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const joinUrl = (baseUrl: string, path: string) =>
  `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

export const encodePathSegment = (value: string | number) => encodeURIComponent(String(value))

const readBody = async (response: Response): Promise<unknown> => {
  if (EMPTY_STATUSES.has(response.status)) return undefined
  const text = await response.text()
  if (!text) return undefined
  const isJson = response.headers.get('Content-Type')?.includes('json') ?? false
  return isJson ? JSON.parse(text) : text
}

export function createApiClient({
  baseUrl,
  timeoutMs: defaultTimeoutMs = DEFAULT_TIMEOUT_MS,
  credentials = 'same-origin',
  headers: defaultHeaders,
  getAccessToken = () => null,
  onUnauthorized,
}: ApiClientOptions): ApiClient {
  const request = async <T>(
    method: HttpMethod,
    path: string,
    { query, body, headers, signal, timeoutMs = defaultTimeoutMs }: ApiRequestOptions = {},
  ): Promise<T> => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const requestHeaders = new Headers(defaultHeaders)
    requestHeaders.set('Accept', 'application/json')

    const token = getAccessToken()
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`)

    let requestBody: BodyInit | undefined
    if (body !== undefined) {
      if (isRawBody(body)) requestBody = body
      else {
        requestHeaders.set('Content-Type', 'application/json')
        requestBody = JSON.stringify(body)
      }
    }

    new Headers(headers).forEach((value, key) => requestHeaders.set(key, value))

    let response: Response
    try {
      response = await fetch(joinUrl(baseUrl, path) + buildQueryString(query), {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials,
        signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
      })
    } catch (error) {
      if (timeoutSignal.aborted) throw ApiError.fromKind('timeout', error)
      if (signal?.aborted) throw ApiError.fromKind('aborted', error)
      throw ApiError.fromKind('network', error)
    }

    let data: unknown
    try {
      data = await readBody(response)
    } catch (error) {
      if (!response.ok) throw ApiError.fromResponse(response.status, undefined)
      throw ApiError.fromKind('parse', error)
    }

    if (!response.ok) {
      const error = ApiError.fromResponse(response.status, data)
      if (error.isUnauthorized) onUnauthorized?.(error)
      throw error
    }

    return data as T
  }

  return {
    request,
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    put: (path, body, options) => request('PUT', path, { ...options, body }),
    patch: (path, body, options) => request('PATCH', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options),
  }
}
