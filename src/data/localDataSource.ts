import { LocalCalendarRepository } from '../features/calendars/index.ts'
import {
  LocalCategoryRepository,
  LocalColorRepository,
  LocalEventRepository,
  LocalPreferencesRepository,
} from '../features/storage/index.ts'
import type { CalendarDataSource, DataRepositories } from './types.ts'

export const createLocalRepositories = (): DataRepositories => ({
  mode: 'local',
  events: new LocalEventRepository(),
  calendars: new LocalCalendarRepository(),
  colors: new LocalColorRepository(),
  preferences: new LocalPreferencesRepository(),
  categories: new LocalCategoryRepository(),
})

export const localDataSource = (): CalendarDataSource => ({
  connect: createLocalRepositories,
})
