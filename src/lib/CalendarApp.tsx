import { useMemo, useState, type ReactNode } from 'react'
import { RouterProvider } from 'react-router'
import type { CalendarDataSource } from '../data/index.ts'
import { AuthProvider, useAuth } from '../features/authorization/index.ts'
import { CalendarsProvider } from '../features/calendars/index.ts'
import { PreferencesProvider } from '../features/preferences/index.ts'
import { StorageProvider } from '../features/storage/index.ts'
import { useI18n, useLocaleGetter } from '../i18n/index.ts'
import { createCalendarRouter } from '../router.tsx'
import type { CalendarRouting } from './config.ts'

type SessionProvidersProps = {
  dataSource: CalendarDataSource
  children: ReactNode
}

function SessionProviders({ dataSource, children }: SessionProvidersProps) {
  const { m } = useI18n()
  const getLanguage = useLocaleGetter()
  const { status, user, expireSession } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const repositories = useMemo(
    () => dataSource.connect({ isAuthenticated }, { getLanguage, onUnauthorized: expireSession }),
    [dataSource, isAuthenticated, getLanguage, expireSession],
  )
  const storage = useMemo(
    () => ({
      mode: repositories.mode,
      events: repositories.events,
      colors: repositories.colors,
      preferences: repositories.preferences,
    }),
    [repositories],
  )

  if (status === 'loading') return <p className="appLoading">{m.common.loading}</p>
  return (
    <StorageProvider repositories={storage}>
      <PreferencesProvider>
        <CalendarsProvider key={user?.id ?? 'guest'} repository={repositories.calendars}>
          {children}
        </CalendarsProvider>
      </PreferencesProvider>
    </StorageProvider>
  )
}

type CalendarAppProps = {
  dataSource: CalendarDataSource
  routing: CalendarRouting
  basename?: string
  initialPath?: string
}

export function CalendarApp({ dataSource, routing, basename, initialPath }: CalendarAppProps) {
  const getLanguage = useLocaleGetter()
  const authRepository = useMemo(
    () => dataSource.createAuthRepository?.({ getLanguage }) ?? null,
    [dataSource, getLanguage],
  )
  const [router] = useState(() => createCalendarRouter(routing, { basename, initialPath }))

  return (
    <AuthProvider repository={authRepository}>
      <SessionProviders dataSource={dataSource}>
        <RouterProvider router={router} />
      </SessionProviders>
    </AuthProvider>
  )
}
