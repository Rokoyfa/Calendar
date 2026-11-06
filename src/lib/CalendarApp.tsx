import { useMemo, useState, type ReactNode } from 'react'
import { RouterProvider } from 'react-router'
import { useI18n } from '../i18n/index.ts'
import { createStorageConfig } from '../config/storage.ts'
import { AuthProvider, RemoteAuthRepository, useAuth } from '../features/authorization/index.ts'
import { CalendarsProvider } from '../features/calendars/index.ts'
import { PreferencesProvider } from '../features/preferences/index.ts'
import { StorageProvider } from '../features/storage/index.ts'
import { createCalendarRouter } from '../router.tsx'
import { createApiClient } from '../utils/api.ts'
import type { CalendarConfig, CalendarRouting } from './config.ts'

type SessionStorageProviderProps = {
  config: CalendarConfig
  children: ReactNode
}

function SessionStorageProvider({ config, children }: SessionStorageProviderProps) {
  const { m } = useI18n()
  const { status, user, expireSession } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const storageConfig = useMemo(
    () => createStorageConfig(config, { isAuthenticated, onUnauthorized: expireSession }),
    [config, isAuthenticated, expireSession],
  )

  if (status === 'loading') return <p className="appLoading">{m.common.loading}</p>
  return (
    <StorageProvider config={storageConfig}>
      <PreferencesProvider>
        <CalendarsProvider key={user?.id ?? 'guest'} config={storageConfig}>
          {children}
        </CalendarsProvider>
      </PreferencesProvider>
    </StorageProvider>
  )
}

type CalendarAppProps = {
  config: CalendarConfig
  routing: CalendarRouting
  basename?: string
  initialPath?: string
}

export function CalendarApp({ config, routing, basename, initialPath }: CalendarAppProps) {
  const authRepository = useMemo(
    () => new RemoteAuthRepository(createApiClient({ baseUrl: config.apiBaseUrl, timeoutMs: config.apiTimeoutMs })),
    [config.apiBaseUrl, config.apiTimeoutMs],
  )
  const [router] = useState(() => createCalendarRouter(routing, { basename, initialPath }))

  return (
    <AuthProvider repository={authRepository} enabled={config.features.auth}>
      <SessionStorageProvider config={config}>
        <RouterProvider router={router} />
      </SessionStorageProvider>
    </AuthProvider>
  )
}
