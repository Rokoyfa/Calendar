import { AppError } from '../../../utils/appError.ts'
import { PERSONAL_CALENDAR_ID } from '../../../config/calendars.ts'
import {
  eventOccursInRange,
  matchesEventText,
  parseCalendarEvent,
  type CalendarEvent,
  type EventInput,
} from '../../../utils/event.ts'
import { ANY_EVENT_CHANGE, type EventChange } from '../../../utils/eventChange.ts'
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
  readonly #storageKey: string

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#storageKey = storageKey
    this.#events = new LocalStorageList(storageKey, parseLocalEvent, 'saveEventsFailed')
  }

  subscribe(listener: (change: EventChange) => void) {
    if (typeof window === 'undefined') return () => {}
    const onStorage = (event: StorageEvent) => {
      if (event.key === this.#storageKey || event.key === null) listener(ANY_EVENT_CHANGE)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }

  async list({ from, to, calendarIds }: EventQuery) {
    return this.#events
      .read()
      .filter((event) => calendarIds.includes(event.calendarId) && eventOccursInRange(event, from, to))
  }

  async search({ text, calendarIds }: EventSearchQuery) {
    return this.#events
      .read()
      .filter((event) => calendarIds.includes(event.calendarId) && matchesEventText(event, text))
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
      attachmentCount: 0,
      version: 1,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    }
    this.#events.update((events) => [...events, event])
    return event
  }

  async update(id: string, input: EventInput, version?: number) {
    const existing = this.#find(id, version)
    const updated: CalendarEvent = {
      ...existing,
      ...input,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    }
    this.#events.update((events) => events.map((event) => (event.id === id ? updated : event)))
    return updated
  }

  #find(id: string, version: number | undefined) {
    const existing = this.#events.read().find((event) => event.id === id)
    if (!existing) throw new AppError('eventNotFound')
    if (version !== undefined && existing.version !== version) throw new AppError('eventChanged')
    return existing
  }

  async remove(id: string, version?: number) {
    if (version !== undefined) this.#find(id, version)
    this.#events.update((events) => events.filter((event) => event.id !== id))
  }
}
