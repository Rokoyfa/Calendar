import { isCalendarEvent, type CalendarEvent, type EventInput } from '../../../utils/event.ts'
import type { DateRange, EventRepository } from '../types/storage.ts'

export const LOCAL_CALENDAR_ID = 'local'
const DEFAULT_STORAGE_KEY = 'calendar.events.v1'

export class LocalEventRepository implements EventRepository {
  readonly #storageKey: string

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#storageKey = storageKey
  }

  async list({ from, to }: DateRange) {
    return this.#read().filter((event) => event.date >= from && event.date <= to)
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
    this.#write([...this.#read(), event])
    return event
  }

  async update(id: string, input: EventInput) {
    const events = this.#read()
    const existing = events.find((event) => event.id === id)
    if (!existing) throw new Error('Der Termin wurde nicht gefunden.')

    const updated: CalendarEvent = { ...existing, ...input, updatedAt: new Date().toISOString() }
    this.#write(events.map((event) => (event.id === id ? updated : event)))
    return updated
  }

  async remove(id: string) {
    this.#write(this.#read().filter((event) => event.id !== id))
  }

  #read(): CalendarEvent[] {
    try {
      const raw = localStorage.getItem(this.#storageKey)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.filter(isCalendarEvent) : []
    } catch {
      return []
    }
  }

  #write(events: CalendarEvent[]) {
    try {
      localStorage.setItem(this.#storageKey, JSON.stringify(events))
    } catch {
      throw new Error('Der Termin konnte nicht lokal gespeichert werden.')
    }
  }
}
