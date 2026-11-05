import { useMemo, type ReactNode } from 'react'
import { RouterProvider } from 'react-router'
import { authRepository } from './config/auth.ts'
import { env } from './config/env.ts'
import { createStorageConfig } from './config/storage.ts'
import { AuthProvider, useAuth } from './features/authorization/index.ts'
import { CalendarsProvider } from './features/calendars/index.ts'
import { PreferencesProvider } from './features/preferences/index.ts'
import { StorageProvider } from './features/storage/index.ts'
import { router } from './router.tsx'

function SessionStorageProvider({ children }: { children: ReactNode }) {
  const { status, user, expireSession } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const config = useMemo(
    () => createStorageConfig(env, { isAuthenticated, onUnauthorized: expireSession }),
    [isAuthenticated, expireSession],
  )

  if (status === 'loading') return <p className="appLoading">Lädt …</p>
  return (
    <StorageProvider config={config}>
      <PreferencesProvider>
        <CalendarsProvider key={user?.id ?? 'guest'} config={config}>
          {children}
        </CalendarsProvider>
      </PreferencesProvider>
    </StorageProvider>
  )
}

function App() {
  return (
    <AuthProvider repository={authRepository} enabled={env.features.auth}>
      <SessionStorageProvider>
        <RouterProvider router={router} />
      </SessionStorageProvider>
    </AuthProvider>
  )
}

export default App
