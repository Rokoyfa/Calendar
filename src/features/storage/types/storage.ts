import type { HexColor } from '../../../utils/color.ts'
import type { DateRange } from '../../../utils/date.ts'
import type { AttendeeStatus, CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { Preferences } from '../../../utils/preferences.ts'

export type EventQuery = DateRange & { calendarIds: readonly string[] }

export type EventSearchQuery = { text: string; calendarIds: readonly string[] }

export interface EventRepository {
  list(query: EventQuery): Promise<CalendarEvent[]>
  listSeries(seriesId: string): Promise<CalendarEvent[]>
  create(calendarId: string, input: EventInput): Promise<CalendarEvent>
  update(id: string, input: EventInput): Promise<CalendarEvent>
  remove(id: string): Promise<void>
  search?(query: EventSearchQuery): Promise<CalendarEvent[]>
  respond?(id: string, status: AttendeeStatus): Promise<CalendarEvent>
}

export interface ColorRepository {
  list(): Promise<HexColor[]>
  add(color: HexColor): Promise<HexColor[]>
  remove(color: HexColor): Promise<HexColor[]>
}

export interface PreferencesRepository {
  get(): Promise<Preferences>
  update(changes: Partial<Preferences>): Promise<Preferences>
}

export type StorageMode = 'local' | 'remote'

export type StorageRepositories = {
  mode: StorageMode
  events: EventRepository
  colors: ColorRepository
  preferences: PreferencesRepository
}

export type StorageContextValue = StorageRepositories & {
  version: number
  invalidate: () => void
}
