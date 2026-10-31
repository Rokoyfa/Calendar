import {
  EVENT_NOT_FOUND_MESSAGE,
  eventOccursInRange,
  parseCalendarEvent,
  type CalendarEvent,
  type EventInput,
} from '../../../utils/event.ts'
import type { DateRange, EventRepository } from '../types/storage.ts'
import { LocalStorageList } from '../utils/localStorageList.ts'

export const LOCAL_CALENDAR_ID = 'local'
const DEFAULT_STORAGE_KEY = 'calendar.events.v1'

export class LocalEventRepository implements EventRepository {
  readonly #events: LocalStorageList<CalendarEvent>

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#events = new LocalStorageList(
      storageKey,
      parseCalendarEvent,
      'Der Termin konnte nicht lokal gespeichert werden.',
    )
  }

  async list({ from, to }: DateRange) {
    return this.#events.read().filter((event) => eventOccursInRange(event, from, to))
  }

  async listSeries(seriesId: string) {
    return this.#events.read().filter((event) => event.id === seriesId || event.seriesId === seriesId)
  }

  async create(input: EventInput) {
    const now = new Date().toISOString()
    const event: CalendarEvent = {
      ...input,
      id: crypto.randomUUID(),
      calendarId: LOCAL_CALENDAR_ID,
      createdAt: now,
      updatedAt: now,
    }
    this.#events.update((events) => [...events, event])
    return event
  }

  async update(id: string, input: EventInput) {
    const existing = this.#events.read().find((event) => event.id === id)
    if (!existing) throw new Error(EVENT_NOT_FOUND_MESSAGE)

    const updated: CalendarEvent = { ...existing, ...input, updatedAt: new Date().toISOString() }
    this.#events.update((events) => events.map((event) => (event.id === id ? updated : event)))
    return updated
  }

  async remove(id: string) {
    this.#events.update((events) => events.filter((event) => event.id !== id))
  }
}
