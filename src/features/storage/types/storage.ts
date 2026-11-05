import type { HexColor } from '../../../utils/color.ts'
import type { DateRange } from '../../../utils/date.ts'
import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { Preferences } from '../../../utils/preferences.ts'

export type { DateRange }

export type EventQuery = DateRange & { calendarIds: readonly string[] }

export interface EventRepository {
  list(query: EventQuery): Promise<CalendarEvent[]>
  listSeries(seriesId: string): Promise<CalendarEvent[]>
  create(calendarId: string, input: EventInput): Promise<CalendarEvent>
  update(id: string, input: EventInput): Promise<CalendarEvent>
  remove(id: string): Promise<void>
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

export type StorageConfig =
  | { mode: 'local' }
  | {
      mode: 'remote'
      baseUrl: string
      timeoutMs?: number
      getAccessToken?: () => string | null
      onUnauthorized?: () => void
    }

export type StorageMode = StorageConfig['mode']

export type StorageContextValue = {
  mode: StorageMode
  events: EventRepository
  colors: ColorRepository
  preferences: PreferencesRepository
  version: number
  invalidate: () => void
}
