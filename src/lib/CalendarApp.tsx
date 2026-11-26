import { useEffect, useMemo, type ReactNode, type RefObject } from 'react'
import type { CalendarDataSource } from '../data/index.ts'
import { useFeatures } from '../context/HostContext.ts'
import { AuthProvider, useAuth } from '../features/authorization/index.ts'
import { CalendarsProvider } from '../features/calendars/index.ts'
import { PreferencesProvider } from '../features/preferences/index.ts'
import { ReminderNotices } from '../features/reminders/ReminderNotices.tsx'
import {
  CaldavEventRepository,
  PeerEventRepository,
  StorageProvider,
  type EventRepository,
  withCaldavEvents,
  withPeerEvents,
} from '../features/storage/index.ts'
import { CaldavProvider } from '../features/caldav/index.ts'
import { useI18n, useLocaleGetter } from '../i18n/index.ts'
import { CalendarRouter } from '../router.tsx'
import type { CalendarRouting } from './config.ts'
import { withEventCallbacks, type EventCallbacks } from './eventCallbacks.ts'
import { ExternalCalendarsProvider } from '../features/external/index.ts'
import { PeerCalendarsProvider } from '../features/peers/index.ts'
import { PushSync } from '../features/push/index.ts'

type EventCallbacksRef = RefObject<EventCallbacks>

type SessionProvidersProps = {
  dataSource: CalendarDataSource
  eventCallbacks: EventCallbacksRef
  children: ReactNode
}

const withPeers = (events: EventRepository, peers: PeerEventRepository | undefined) =>
  peers ? withPeerEvents(events, peers) : events

function SessionProviders({ dataSource, eventCallbacks, children }: SessionProvidersProps) {
  const { m } = useI18n()
  const getLanguage = useLocaleGetter()
  const { status, user, expireSession } = useAuth()
  const { reminders, caldav, caldavAccounts, personalSharing, tasks, freeBusy, push, notifications } = useFeatures()
  const isAuthenticated = status === 'authenticated'
  const repositories = useMemo(
    () => dataSource.connect({ isAuthenticated }, { getLanguage, onUnauthorized: expireSession }),
    [dataSource, isAuthenticated, getLanguage, expireSession],
  )
  const caldavEvents = useMemo(
    () => (caldavAccounts && repositories.caldav ? new CaldavEventRepository(repositories.caldav) : undefined),
    [caldavAccounts, repositories],
  )
  useEffect(() => caldavEvents?.setEmail(user?.email ?? null), [caldavEvents, user])
  const sharing = personalSharing ? repositories.personalSharing : undefined
  const peerEvents = useMemo(() => (sharing ? new PeerEventRepository(sharing) : undefined), [sharing])
  useEffect(() => peerEvents?.setBusyTitle(m.peers.busy), [peerEvents, m])
  const storage = useMemo(
    () => ({
      mode: repositories.mode,
      events: withEventCallbacks(
        withPeers(caldavEvents ? withCaldavEvents(repositories.events, caldavEvents) : repositories.events, peerEvents),
        () => eventCallbacks.current,
      ),
      colors: repositories.colors,
      preferences: repositories.preferences,
      holidays: repositories.holidays,
      chat: repositories.chat,
      categories: repositories.categories,
      shared: repositories.shared,
      bookings: repositories.bookings,
      personalSharing: sharing,
      peerEvents,
      attachments: repositories.attachments,
      externalCalendars: repositories.externalCalendars,
      history: repositories.history,
      notifications: repositories.notifications,
      appPasswords: caldav ? repositories.appPasswords : undefined,
      caldav: caldavEvents ? repositories.caldav : undefined,
      caldavEvents,
      tasks: tasks ? repositories.tasks : undefined,
      freeBusy: freeBusy && isAuthenticated ? repositories.freeBusy : undefined,
      push: push && notifications && isAuthenticated ? repositories.push : undefined,
    }),
    [
      repositories,
      eventCallbacks,
      caldav,
      caldavEvents,
      sharing,
      peerEvents,
      tasks,
      freeBusy,
      push,
      notifications,
      isAuthenticated,
    ],
  )

  if (status === 'loading') return <p className="appLoading">{m.common.loading}</p>
  return (
    <StorageProvider repositories={storage}>
      <PushSync />
      <PreferencesProvider>
        <CalendarsProvider
          key={user?.id ?? 'guest'}
          storageScope={user?.id ?? 'guest'}
          repository={repositories.calendars}
        >
          <ExternalCalendarsProvider>
            <CaldavProvider>
              <PeerCalendarsProvider>
                {children}
                {reminders && <ReminderNotices />}
              </PeerCalendarsProvider>
            </CaldavProvider>
          </ExternalCalendarsProvider>
        </CalendarsProvider>
      </PreferencesProvider>
    </StorageProvider>
  )
}

type CalendarAppProps = {
  dataSource: CalendarDataSource
  eventCallbacks: EventCallbacksRef
  routing: CalendarRouting
  basename?: string
  initialPath?: string
}

export function CalendarApp({ dataSource, eventCallbacks, routing, basename, initialPath }: CalendarAppProps) {
  const getLanguage = useLocaleGetter()
  const authRepository = useMemo(
    () => dataSource.createAuthRepository?.({ getLanguage }) ?? null,
    [dataSource, getLanguage],
  )

  return (
    <AuthProvider repository={authRepository}>
      <SessionProviders dataSource={dataSource} eventCallbacks={eventCallbacks}>
        <CalendarRouter routing={routing} basename={basename} initialPath={initialPath} />
      </SessionProviders>
    </AuthProvider>
  )
}
