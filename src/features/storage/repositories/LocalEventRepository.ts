import { AppError } from '../../../utils/appError.ts'
import { PERSONAL_CALENDAR_ID } from '../../../config/calendars.ts'
import {
  eventOccursInRange,
  parseCalendarEvent,
  type CalendarEvent,
  type EventInput,
} from '../../../utils/event.ts'
import type { EventQuery, EventRepository, EventSearchQuery } from '../types/storage.ts'
import { LocalStorageList } from '../utils/localStorageList.ts'

const DEFAULT_STORAGE_KEY = 'calendar.events.v1'
const LEGACY_CALENDAR_ID = 'local'

const parseLocalEvent = (value: unknown) => {
  const event = parseCalendarEvent(value)
  return event?.calendarId === LEGACY_CALENDAR_ID ? { ...event, calendarId: PERSONAL_CALENDAR_ID } : event
}

export class LocalEventRepository implements EventRepository {
  readonly #events: LocalStorageList<CalendarEvent>

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#events = new LocalStorageList(
      storageKey,
      parseLocalEvent,
      'saveEventsFailed',
    )
  }

  async list({ from, to, calendarIds }: EventQuery) {
    return this.#events
      .read()
      .filter((event) => calendarIds.includes(event.calendarId) && eventOccursInRange(event, from, to))
  }

  async search({ text, calendarIds }: EventSearchQuery) {
    const needle = text.trim().toLocaleLowerCase()
    return this.#events
      .read()
      .filter(
        (event) =>
          calendarIds.includes(event.calendarId) &&
          [event.title, event.location, event.description].some((field) => field.toLocaleLowerCase().includes(needle)),
      )
  }

  async listAll() {
    return this.#events.read()
  }

  async clear() {
    this.#events.write([])
  }

  async listSeries(seriesId: string) {
    return this.#events.read().filter((event) => event.id === seriesId || event.seriesId === seriesId)
  }

  async create(calendarId: string, input: EventInput) {
    const now = new Date().toISOString()
    const event: CalendarEvent = {
      ...input,
      id: crypto.randomUUID(),
      calendarId,
      createdAt: now,
      updatedAt: now,
    }
    this.#events.update((events) => [...events, event])
    return event
  }

  async update(id: string, input: EventInput) {
    const existing = this.#events.read().find((event) => event.id === id)
    if (!existing) throw new AppError('eventNotFound')

    const updated: CalendarEvent = { ...existing, ...input, updatedAt: new Date().toISOString() }
    this.#events.update((events) => events.map((event) => (event.id === id ? updated : event)))
    return updated
  }

  async remove(id: string) {
    this.#events.update((events) => events.filter((event) => event.id !== id))
  }
}
