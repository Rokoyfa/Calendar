import { AppError } from '../../../utils/appError.ts'
import { PERSONAL_CALENDAR_ID } from '../../../config/calendars.ts'
import {
  eventOccursInRange,
  matchesEventText,
  parseCalendarEvent,
  type CalendarEvent,
  type EventInput,
} from '../../../utils/event.ts'
import { addTrashDays, isExpired, parseTrashedEvent, type TrashedEvent } from '../../../utils/trash.ts'
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
  readonly #trash: LocalStorageList<TrashedEvent>
  readonly #storageKey: string

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#storageKey = storageKey
    this.#trash = new LocalStorageList(`${storageKey}.trash`, parseTrashedEvent, 'saveEventsFailed')
    this.#events = new LocalStorageList(storageKey, parseLocalEvent, 'saveEventsFailed')
  }

  subscribe(listener: (change: EventChange) => void) {
    if (typeof window === 'undefined') return () => {}
    const onStorage = (event: StorageEvent) => {
      if (event.key === this.#storageKey || event.key === `${this.#storageKey}.trash` || event.key === null)
        listener(ANY_EVENT_CHANGE)
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
    this.#trash.write([])
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

  async move(id: string, calendarId: string, version?: number) {
    const existing = this.#find(id, version)
    if (existing.seriesId !== null) throw new AppError('forbidden')
    const updatedAt = new Date().toISOString()
    let moved = existing
    this.#events.update((events) =>
      events.map((event) => {
        if (event.id !== id && event.seriesId !== id) return event
        const next = { ...event, calendarId, categoryIds: [], version: event.version + 1, updatedAt }
        if (event.id === id) moved = next
        return next
      }),
    )
    return moved
  }

  #find(id: string, version: number | undefined) {
    const existing = this.#events.read().find((event) => event.id === id)
    if (!existing) throw new AppError('eventNotFound')
    if (version !== undefined && existing.version !== version) throw new AppError('eventChanged')
    return existing
  }

  async remove(id: string, version?: number) {
    const existing = this.#find(id, version)
    const deletedAt = new Date().toISOString()
    this.#trash.update((entries) => [
      {
        event: existing,
        deletedAt,
        deletedBy: null,
        deletedByName: null,
        expiresAt: addTrashDays(deletedAt),
        detachedCount: 0,
      },
      ...this.#current(entries).filter((entry) => entry.event.id !== id),
    ])
    this.#events.update((events) => events.filter((event) => event.id !== id))
  }

  async listTrash(calendarId: string) {
    return this.#current(this.#trash.read()).filter((entry) => entry.event.calendarId === calendarId)
  }

  async restore(id: string) {
    const entry = this.#current(this.#trash.read()).find((candidate) => candidate.event.id === id)
    if (!entry) throw new AppError('eventNotFound')
    const events = this.#events.read()
    if (entry.event.seriesId && !events.some((event) => event.id === entry.event.seriesId))
      throw new AppError('seriesDeleted')
    const restored: CalendarEvent = {
      ...entry.event,
      version: entry.event.version + 1,
      updatedAt: new Date().toISOString(),
    }
    this.#events.write([...events.filter((event) => event.id !== id), restored])
    this.#trash.update((entries) => entries.filter((candidate) => candidate.event.id !== id))
    return restored
  }

  async purge(_calendarId: string, id: string) {
    this.#trash.update((entries) => entries.filter((entry) => entry.event.id !== id))
  }

  async emptyTrash(calendarId: string) {
    const removed = this.#current(this.#trash.read()).filter((entry) => entry.event.calendarId === calendarId)
    this.#trash.update((entries) => entries.filter((entry) => entry.event.calendarId !== calendarId))
    return removed.length
  }

  #current(entries: readonly TrashedEvent[]) {
    const now = Date.now()
    return entries.filter((entry) => !isExpired(entry, now))
  }
}
