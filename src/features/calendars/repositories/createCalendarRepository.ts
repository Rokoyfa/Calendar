import { createApiClient } from '../../../utils/api.ts'
import type { StorageConfig } from '../../storage/index.ts'
import type { CalendarRepository } from '../types/calendar.ts'
import { LocalCalendarRepository } from './LocalCalendarRepository.ts'
import { RemoteCalendarRepository } from './RemoteCalendarRepository.ts'

export function createCalendarRepository(config: StorageConfig): CalendarRepository {
  switch (config.mode) {
    case 'local':
      return new LocalCalendarRepository()
    case 'remote':
      return new RemoteCalendarRepository(
        createApiClient({
          baseUrl: config.baseUrl,
          timeoutMs: config.timeoutMs,
          getAccessToken: config.getAccessToken,
          onUnauthorized: config.onUnauthorized,
        }),
      )
  }
}
