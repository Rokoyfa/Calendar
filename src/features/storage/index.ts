export { StorageProvider } from './context/StorageProvider.tsx'
export { useColorRepository, useEventRepository, useStorage } from './hooks/useStorage.ts'
export { createEventRepository } from './repositories/createEventRepository.ts'
export { LocalEventRepository, LOCAL_CALENDAR_ID } from './repositories/LocalEventRepository.ts'
export { LocalColorRepository } from './repositories/LocalColorRepository.ts'
export { RemoteEventRepository } from './repositories/RemoteEventRepository.ts'
export type {
  ColorRepository,
  DateRange,
  EventRepository,
  StorageConfig,
  StorageContextValue,
  StorageMode,
} from './types/storage.ts'
