import type { StorageConfig } from '../features/storage/index.ts'
import type { CalendarConfig } from '../lib/config.ts'

type SessionState = {
  isAuthenticated: boolean
  onUnauthorized: () => void
  getLanguage?: () => string | null
}

const LOCAL_CONFIG: StorageConfig = { mode: 'local' }

export function createStorageConfig(
  { storageMode, apiBaseUrl, apiTimeoutMs, features }: CalendarConfig,
  session: SessionState,
): StorageConfig {
  const useRemote = features.auth ? session.isAuthenticated : storageMode === 'remote'
  if (!useRemote) return LOCAL_CONFIG
  return {
    mode: 'remote',
    baseUrl: apiBaseUrl,
    timeoutMs: apiTimeoutMs,
    onUnauthorized: session.onUnauthorized,
    getLanguage: session.getLanguage,
  }
}
