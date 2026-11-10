import type { StorageConfig } from '../types/storage.ts'
import { createRemoteApi } from '../utils/remoteApi.ts'
import { LocalColorRepository } from './LocalColorRepository.ts'
import { LocalEventRepository } from './LocalEventRepository.ts'
import { LocalPreferencesRepository } from './LocalPreferencesRepository.ts'
import { RemoteColorRepository } from './RemoteColorRepository.ts'
import { RemoteEventRepository } from './RemoteEventRepository.ts'
import { RemotePreferencesRepository } from './RemotePreferencesRepository.ts'

export function createRepositories(config: StorageConfig) {
  if (config.mode === 'local')
    return {
      events: new LocalEventRepository(),
      colors: new LocalColorRepository(),
      preferences: new LocalPreferencesRepository(),
    }
  const api = createRemoteApi(config)
  return {
    events: new RemoteEventRepository(api),
    colors: new RemoteColorRepository(api),
    preferences: new RemotePreferencesRepository(api),
  }
}
