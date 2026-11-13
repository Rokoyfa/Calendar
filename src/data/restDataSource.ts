import {
  HostTokenAuthRepository,
  RemoteAuthRepository,
  type UserTokenProvider,
} from '../features/authorization/index.ts'
import { RemoteCalendarRepository } from '../features/calendars/index.ts'
import {
  RemoteCategoryRepository,
  RemoteColorRepository,
  RemoteChatRepository,
  RemoteEventRepository,
  RemoteHolidayRepository,
  RemotePreferencesRepository,
  RemoteSharedCalendarRepository,
} from '../features/storage/index.ts'
import type { HolidaySource } from '../lib/defaults.ts'
import { createApiClient } from '../utils/api.ts'
import { toSocketUrl } from '../utils/chat.ts'
import { createLocalRepositories } from './localDataSource.ts'
import type { CalendarDataSource, DataRepositories, DataSourceContext } from './types.ts'

export type RestDataSourceOptions = {
  baseUrl: string
  timeoutMs?: number
  auth?: boolean
  headers?: HeadersInit
  getAccessToken?: () => string | null
  getUserToken?: UserTokenProvider
  holidaySource?: HolidaySource
  chat?: boolean
  chatSocketUrl?: string
}

export function restDataSource({
  baseUrl,
  timeoutMs,
  auth = true,
  headers,
  getAccessToken,
  getUserToken,
  holidaySource = 'library',
  chat = true,
  chatSocketUrl,
}: RestDataSourceOptions): CalendarDataSource {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const createApi = ({ getLanguage, onUnauthorized }: Partial<DataSourceContext>) =>
    createApiClient({
      baseUrl: normalizedBaseUrl,
      timeoutMs,
      headers,
      getAccessToken,
      getLanguage,
      onUnauthorized,
    })

  const getSocketUrl = () => {
    if (chatSocketUrl) return chatSocketUrl
    const url = new URL(toSocketUrl(normalizedBaseUrl, '/chat/socket'))
    const tenant = new Headers(headers).get('X-Calendar-Tenant')
    if (tenant) url.searchParams.set('tenant', tenant)
    return url.toString()
  }

  const createRemoteRepositories = (context: DataSourceContext): DataRepositories => {
    const api = createApi(context)
    return {
      mode: 'remote',
      events: new RemoteEventRepository(api),
      calendars: new RemoteCalendarRepository(api),
      colors: new RemoteColorRepository(api),
      preferences: new RemotePreferencesRepository(api),
      holidays: holidaySource === 'backend' ? new RemoteHolidayRepository(api) : undefined,
      categories: new RemoteCategoryRepository(api),
      shared: new RemoteSharedCalendarRepository(api),
      chat: chat ? new RemoteChatRepository(api, getSocketUrl()) : undefined,
    }
  }

  return {
    createAuthRepository: !auth
      ? undefined
      : getUserToken
        ? (context) => new HostTokenAuthRepository(createApi(context), getUserToken)
        : (context) => new RemoteAuthRepository(createApi(context)),
    connect: (session, context) =>
      auth && !session.isAuthenticated
        ? { ...createLocalRepositories(), shared: new RemoteSharedCalendarRepository(createApi(context)) }
        : createRemoteRepositories(context),
  }
}
