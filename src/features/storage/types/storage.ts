import type { Category } from '../../../utils/category.ts'
import type { HexColor } from '../../../utils/color.ts'
import type { DateRange } from '../../../utils/date.ts'
import type { AttendeeStatus, CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { ChatEvent, ChatKey, ChatMessage, ChatPage, ChatUnread } from '../../../utils/chat.ts'
import type { PublicHoliday } from '../../../utils/holidays.ts'
import type { Preferences } from '../../../utils/preferences.ts'
import type { SharedCalendar } from '../../../utils/sharedCalendar.ts'

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
  setReminders?(id: string, reminders: number[]): Promise<CalendarEvent>
}

export interface ColorRepository {
  list(): Promise<HexColor[]>
  add(color: HexColor): Promise<HexColor[]>
  remove(color: HexColor): Promise<HexColor[]>
}

export interface CategoryRepository {
  list(calendarIds: readonly string[]): Promise<Category[]>
  create(calendarId: string, name: string): Promise<Category>
  rename(id: string, name: string): Promise<Category>
  remove(id: string): Promise<void>
}

export interface SharedCalendarRepository {
  get(token: string): Promise<SharedCalendar>
  listEvents(token: string, range: DateRange): Promise<CalendarEvent[]>
}

export interface PreferencesRepository {
  get(): Promise<Preferences>
  update(changes: Partial<Preferences>): Promise<Preferences>
}

export type HolidayQuery = DateRange & { region: string; language: string }

export interface HolidayRepository {
  list(query: HolidayQuery): Promise<PublicHoliday[]>
}

export interface ChatRepository {
  list(key: ChatKey, options?: { before?: string }): Promise<ChatPage>
  send(key: ChatKey, text: string): Promise<ChatMessage>
  edit(id: string, text: string): Promise<ChatMessage>
  remove(id: string): Promise<void>
  markRead(key: ChatKey): Promise<void>
  unread(calendarIds: readonly string[]): Promise<ChatUnread[]>
  subscribe(listener: (event: ChatEvent) => void): () => void
}

export type StorageMode = 'local' | 'remote'

export type StorageRepositories = {
  mode: StorageMode
  events: EventRepository
  colors: ColorRepository
  preferences: PreferencesRepository
  holidays?: HolidayRepository
  chat?: ChatRepository
  categories?: CategoryRepository
  shared?: SharedCalendarRepository
}

export type StorageContextValue = StorageRepositories & {
  version: number
  invalidate: () => void
}
