import type { StorageConfig } from '../features/storage/index.ts'
import { env, type AppEnv } from './env.ts'

export function createStorageConfig({ storageMode, apiBaseUrl, apiTimeoutMs }: AppEnv): StorageConfig {
  if (storageMode === 'remote') return { mode: 'remote', baseUrl: apiBaseUrl, timeoutMs: apiTimeoutMs }
  return { mode: 'local' }
}

export const storageConfig = createStorageConfig(env)
