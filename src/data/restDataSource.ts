import {
  HostTokenAuthRepository,
  RemoteAuthRepository,
  type UserTokenProvider,
} from '../features/authorization/index.ts'
import { RemoteAttachmentRepository } from '../features/attachments/index.ts'
import { RemoteCategoryRepository } from '../features/categories/index.ts'
import { RemoteColorRepository, RemotePreferencesRepository } from '../features/preferences/index.ts'
import { RemoteChatRepository, toSocketUrl } from '../features/chat/index.ts'
import { RemoteEventRepository, RemoteHistoryRepository } from '../features/events/index.ts'
import { RemoteHolidayRepository } from '../features/holidays/index.ts'
import { RemoteCalendarRepository, RemoteSharedCalendarRepository } from '../features/calendars/index.ts'
import { RemoteBookingRepository } from '../features/bookings/index.ts'
import { RemotePersonalSharingRepository } from '../features/peers/index.ts'
import { RemoteExternalCalendarRepository } from '../features/external/index.ts'
import { RemoteAppPasswordRepository, RemoteCaldavRepository } from '../features/caldav/index.ts'
import { RemoteNotificationRepository } from '../features/notifications/index.ts'
import { LiveSocket } from '../utils/liveSocket.ts'
import { RemoteTaskRepository } from '../features/tasks/index.ts'
import { RemoteFreeBusyRepository } from '../features/freebusy/index.ts'
import { RemotePushRepository } from '../features/push/index.ts'
import type { HolidaySource } from '../config/defaults.ts'
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
  chat?: boolean
  liveUpdates?: boolean
  notifications?: boolean
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
  liveUpdates = true,
  notifications = true,
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
    const socket = chat || liveUpdates || notifications ? new LiveSocket(getSocketUrl()) : undefined
    return {
      mode: 'remote',
      events: new RemoteEventRepository(api, liveUpdates ? socket : undefined),
      calendars: new RemoteCalendarRepository(api),
      colors: new RemoteColorRepository(api),
      preferences: new RemotePreferencesRepository(api),
      holidays: holidaySource === 'backend' ? new RemoteHolidayRepository(api) : undefined,
      categories: new RemoteCategoryRepository(api),
      shared: new RemoteSharedCalendarRepository(api),
      bookings: new RemoteBookingRepository(api),
      personalSharing: new RemotePersonalSharingRepository(api),
      attachments: new RemoteAttachmentRepository(api),
      chat: chat && socket ? new RemoteChatRepository(api, socket) : undefined,
      externalCalendars: new RemoteExternalCalendarRepository(api),
      history: new RemoteHistoryRepository(api),
      notifications: notifications ? new RemoteNotificationRepository(api, socket) : undefined,
      appPasswords: new RemoteAppPasswordRepository(api),
      caldav: new RemoteCaldavRepository(api),
      tasks: new RemoteTaskRepository(api),
      freeBusy: new RemoteFreeBusyRepository(api),
      push: new RemotePushRepository(api),
    }
  }

  const guestRepositories = (api: ReturnType<typeof createApi>): DataRepositories => ({
    ...createLocalRepositories(),
    shared: new RemoteSharedCalendarRepository(api),
    bookings: new RemoteBookingRepository(api),
  })

  return {
    createAuthRepository: !auth
      ? undefined
      : getUserToken
        ? (context) => new HostTokenAuthRepository(createApi(context), getUserToken)
        : (context) => new RemoteAuthRepository(createApi(context)),
    connect: (session, context) =>
      auth && !session.isAuthenticated ? guestRepositories(createApi(context)) : createRemoteRepositories(context),
  }
}
