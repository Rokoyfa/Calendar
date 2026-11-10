import { createRemoteApi, type StorageConfig } from '../../storage/index.ts'
import type { CalendarRepository } from '../types/calendar.ts'
import { LocalCalendarRepository } from './LocalCalendarRepository.ts'
import { RemoteCalendarRepository } from './RemoteCalendarRepository.ts'

export function createCalendarRepository(config: StorageConfig): CalendarRepository {
  return config.mode === 'local' ? new LocalCalendarRepository() : new RemoteCalendarRepository(createRemoteApi(config))
}
