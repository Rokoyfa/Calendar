import { LocalCalendarRepository } from '../features/calendars/index.ts'
import {
  LocalCategoryRepository,
  LocalColorRepository,
  LocalEventRepository,
  LocalPreferencesRepository,
} from '../features/storage/index.ts'
import { LocalTaskRepository } from '../features/tasks/index.ts'
import type { CalendarDataSource, DataRepositories } from './types.ts'

export const createLocalRepositories = (): DataRepositories => {
  const events = new LocalEventRepository()
  return {
    mode: 'local',
    events,
    calendars: new LocalCalendarRepository(),
    colors: new LocalColorRepository(),
    preferences: new LocalPreferencesRepository(),
    categories: new LocalCategoryRepository(),
    tasks: new LocalTaskRepository(undefined, events),
  }
}

export const localDataSource = (): CalendarDataSource => ({
  connect: createLocalRepositories,
})
