import {
  HostTokenAuthRepository,
  RemoteAuthRepository,
  type UserTokenProvider,
} from '../features/authorization/index.ts'
import { RemoteCalendarRepository } from '../features/calendars/index.ts'
import {
  RemoteColorRepository,
  RemoteEventRepository,
  RemoteHolidayRepository,
  RemotePreferencesRepository,
} from '../features/storage/index.ts'
import type { HolidaySource } from '../lib/defaults.ts'
import { createApiClient } from '../utils/api.ts'
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
}

export function restDataSource({
  baseUrl,
  timeoutMs,
  auth = true,
  headers,
  getAccessToken,
  getUserToken,
  holidaySource = 'library',
}: RestDataSourceOptions): CalendarDataSource {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  const createApi = ({ getLanguage, onUnauthorized }: Partial<DataSourceContext>) =>
    createApiClient({ baseUrl: normalizedBaseUrl, timeoutMs, headers, getAccessToken, getLanguage, onUnauthorized })

  const createRemoteRepositories = (context: DataSourceContext): DataRepositories => {
    const api = createApi(context)
    return {
      mode: 'remote',
      events: new RemoteEventRepository(api),
      calendars: new RemoteCalendarRepository(api),
      colors: new RemoteColorRepository(api),
      preferences: new RemotePreferencesRepository(api),
      holidays: holidaySource === 'backend' ? new RemoteHolidayRepository(api) : undefined,
    }
  }

  return {
    createAuthRepository: !auth
      ? undefined
      : getUserToken
        ? (context) => new HostTokenAuthRepository(createApi(context), getUserToken)
        : (context) => new RemoteAuthRepository(createApi(context)),
    connect: (session, context) =>
      auth && !session.isAuthenticated ? createLocalRepositories() : createRemoteRepositories(context),
  }
}
