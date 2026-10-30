import type { HexColor } from '../../../utils/color.ts'
import type { CalendarEvent, EventInput } from '../../../utils/event.ts'

export type DateRange = {
  from: string
  to: string
}

export interface EventRepository {
  list(range: DateRange): Promise<CalendarEvent[]>
  create(input: EventInput): Promise<CalendarEvent>
  update(id: string, input: EventInput): Promise<CalendarEvent>
  remove(id: string): Promise<void>
}

export interface ColorRepository {
  list(): Promise<HexColor[]>
  add(color: HexColor): Promise<HexColor[]>
  remove(color: HexColor): Promise<HexColor[]>
}

export type StorageConfig =
  | { mode: 'local' }
  | { mode: 'remote'; baseUrl: string; getAccessToken?: () => string | null }

export type StorageMode = StorageConfig['mode']

export type StorageContextValue = {
  mode: StorageMode
  events: EventRepository
  colors: ColorRepository
}
