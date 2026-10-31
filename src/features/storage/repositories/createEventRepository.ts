import { LocalEventRepository } from './LocalEventRepository.ts'
import { RemoteEventRepository } from './RemoteEventRepository.ts'
import type { EventRepository, StorageConfig } from '../types/storage.ts'

export function createEventRepository(config: StorageConfig): EventRepository {
  switch (config.mode) {
    case 'local':
      return new LocalEventRepository()
    case 'remote':
      return new RemoteEventRepository(config.baseUrl, {
        timeoutMs: config.timeoutMs,
        getAccessToken: config.getAccessToken,
      })
  }
}
