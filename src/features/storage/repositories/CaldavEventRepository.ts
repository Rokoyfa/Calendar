import { AppError } from '../../../utils/appError.ts'
import {
  buildCaldavObject,
  caldavCalendarId,
  caldavEventId,
  isCaldavCalendarId,
  isInRange,
  parseCaldavEventId,
  toCaldavEvents,
  type CaldavCalendar,
  type CaldavObject,
} from '../../../utils/caldav.ts'
import { createEventUid, type AttendeeStatus, type CalendarEvent, type EventInput } from '../../../utils/event.ts'
import type { CaldavEventSource, CaldavRepository, EventQuery, EventRepository } from '../types/storage.ts'

const CACHE_MS = 60_000

type Loaded = { loadedAt: number; objects: Map<string, CaldavObject> }

type Found = { calendar: CaldavCalendar; object: CaldavObject; events: CalendarEvent[] }

const rawCalendarId = (calendarId: string) => calendarId.slice('caldav:'.length)

export class CaldavEventRepository implements CaldavEventSource {
  readonly #api: CaldavRepository
  readonly #now: () => number
  #calendars = new Map<string, CaldavCalendar>()
  #email: string | null = null
  readonly #loaded = new Map<string, Loaded>()
  readonly #pending = new Map<string, Promise<Loaded>>()

  constructor(api: CaldavRepository, now: () => number = Date.now) {
    this.#api = api
    this.#now = now
  }

  setEmail(email: string | null) {
    this.#email = email
  }

  setCalendars(calendars: readonly CaldavCalendar[]) {
    this.#calendars = new Map(calendars.map((calendar) => [calendar.id, calendar]))
  }

  forget(calendarIds?: readonly string[]) {
    if (!calendarIds) {
      this.#loaded.clear()
      return
    }
    for (const id of calendarIds) this.#loaded.delete(id)
  }

  #calendar(id: string) {
    const calendar = this.#calendars.get(id)
    if (!calendar) throw new AppError('calendarNotFound')
    return calendar
  }

  async #load(calendarId: string): Promise<Loaded> {
    const loaded = this.#loaded.get(calendarId)
    if (loaded && this.#now() - loaded.loadedAt < CACHE_MS) return loaded
    const pending = this.#pending.get(calendarId)
    if (pending) return pending
    const request = this.#api
      .listObjects(calendarId)
      .then((objects) => {
        const fresh = { loadedAt: this.#now(), objects: new Map(objects.map((object) => [object.id, object])) }
        this.#loaded.set(calendarId, fresh)
        return fresh
      })
      .finally(() => this.#pending.delete(calendarId))
    this.#pending.set(calendarId, request)
    return request
  }

  async list({ calendarIds, from, to }: EventQuery) {
    const ids = calendarIds.filter(isCaldavCalendarId).map(rawCalendarId)
    if (ids.some((id) => !this.#calendars.has(id)))
      this.setCalendars((await this.#api.list()).flatMap((account) => account.calendars))
    const lists = await Promise.all(
      ids
        .filter((id) => this.#calendars.has(id))
        .map(async (id) => {
          const calendar = this.#calendar(id)
          const { objects } = await this.#load(id)
          return [...objects.values()].flatMap((object) => toCaldavEvents(calendar, object))
        }),
    )
    return lists.flat().filter((event) => event.seriesId !== null || isInRange(event, from, to))
  }

  async #find(id: string): Promise<Found & { event: CalendarEvent }> {
    const ref = parseCaldavEventId(id)
    if (!ref) throw new AppError('eventNotFound')
    const calendar = this.#calendar(ref.calendarId)
    const object = (await this.#load(ref.calendarId)).objects.get(ref.objectId)
    const events = object ? toCaldavEvents(calendar, object) : []
    const event = events.find((entry) => entry.id === id)
    if (!object || !event) throw new AppError('eventNotFound')
    return { calendar, object, events, event }
  }

  async listSeries(seriesId: string) {
    return (await this.#find(seriesId)).events
  }

  #remember(calendarId: string, object: CaldavObject) {
    this.#loaded.get(calendarId)?.objects.set(object.id, object)
  }

  async #guard<T>(calendarId: string, action: () => Promise<T>) {
    try {
      return await action()
    } catch (error) {
      if (error instanceof AppError && (error.code === 'eventChanged' || error.code === 'eventNotFound'))
        this.forget([calendarId])
      throw error
    }
  }

  async #save({ calendar, object }: Found, events: readonly CalendarEvent[], id: string) {
    const data = buildCaldavObject(object.data, events, calendar.color)
    const saved = await this.#guard(calendar.id, () =>
      this.#api.updateObject(calendar.id, object.id, data, object.etag),
    )
    this.#remember(calendar.id, saved)
    const result = toCaldavEvents(calendar, saved).find((event) => event.id === id)
    if (!result) throw new AppError('eventNotFound')
    return result
  }

  #toEvent(input: EventInput, calendar: CaldavCalendar, id: string, seriesId: string | null): CalendarEvent {
    return {
      ...input,
      id,
      calendarId: caldavCalendarId(calendar.id),
      categoryIds: [],
      seriesId,
      attachmentCount: 0,
      version: 1,
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    }
  }

  async create(calendarId: string, input: EventInput) {
    if (input.seriesId) {
      const found = await this.#find(input.seriesId)
      const series = found.events.find((event) => event.seriesId === null)!
      const ref = parseCaldavEventId(series.id)!
      const id = caldavEventId(ref.calendarId, ref.objectId, input.originalDate)
      const override = this.#toEvent(
        { ...input, uid: series.uid, recurrence: null, excludedDates: [] },
        found.calendar,
        id,
        series.id,
      )
      return this.#save(found, [...found.events.filter((event) => event.id !== id), override], id)
    }
    const calendar = this.#calendar(rawCalendarId(calendarId))
    if (calendar.readOnly) throw new AppError('forbidden')
    const draft = this.#toEvent({ ...input, uid: input.uid || createEventUid() }, calendar, 'new', null)
    const data = buildCaldavObject(null, [draft], calendar.color)
    const created = await this.#api.createObject(calendar.id, data)
    this.#remember(calendar.id, created)
    const [event] = toCaldavEvents(calendar, created)
    if (!event) throw new AppError('unknown')
    return event
  }

  async update(id: string, input: EventInput) {
    const found = await this.#find(id)
    const { event } = found
    const changed: CalendarEvent = {
      ...event,
      ...input,
      id,
      calendarId: event.calendarId,
      categoryIds: [],
      seriesId: event.seriesId,
      originalDate: event.originalDate,
      uid: event.uid,
    }
    const events =
      event.seriesId === null && !changed.recurrence
        ? [changed]
        : found.events.map((entry) => (entry.id === id ? changed : entry))
    return this.#save(found, events, id)
  }

  async remove(id: string) {
    const found = await this.#find(id)
    if (found.event.seriesId !== null) {
      const series = found.events.find((event) => event.seriesId === null)!
      await this.#save(
        found,
        found.events.filter((event) => event.id !== id),
        series.id,
      )
      return
    }
    await this.#guard(found.calendar.id, () =>
      this.#api.removeObject(found.calendar.id, found.object.id, found.object.etag),
    )
    this.#loaded.get(found.calendar.id)?.objects.delete(found.object.id)
  }

  async setReminders(id: string, reminders: number[]) {
    const { event } = await this.#find(id)
    return this.update(id, { ...event, reminders })
  }

  async respond(id: string, status: AttendeeStatus) {
    const email = this.#email
    if (!email) throw new AppError('forbidden')
    const { event } = await this.#find(id)
    const attendees = event.attendees.map((attendee) =>
      attendee.email.toLowerCase() === email.toLowerCase() ? { ...attendee, status } : attendee,
    )
    return this.update(id, { ...event, attendees })
  }
}

export const withCaldavEvents = (main: EventRepository, caldav: CaldavEventRepository): EventRepository => {
  return {
    async list(query) {
      const own = query.calendarIds.filter((id) => !isCaldavCalendarId(id))
      const [mainEvents, caldavEvents] = await Promise.all([
        own.length > 0 || query.calendarIds.length === 0 ? main.list({ ...query, calendarIds: own }) : [],
        own.length < query.calendarIds.length ? caldav.list(query) : [],
      ])
      return caldavEvents.length > 0 ? [...mainEvents, ...caldavEvents] : mainEvents
    },
    listSeries: (seriesId) => (isCaldavCalendarId(seriesId) ? caldav.listSeries(seriesId) : main.listSeries(seriesId)),
    create: (calendarId, input) =>
      isCaldavCalendarId(calendarId) || (input.seriesId !== null && isCaldavCalendarId(input.seriesId))
        ? caldav.create(calendarId, input)
        : main.create(calendarId, input),
    update: (id, input, version) =>
      isCaldavCalendarId(id) ? caldav.update(id, input) : main.update(id, input, version),
    remove: (id, version) => (isCaldavCalendarId(id) ? caldav.remove(id) : main.remove(id, version)),
    search: main.search && ((query) => main.search!(query)),
    respond:
      main.respond &&
      ((id, status) => (isCaldavCalendarId(id) ? caldav.respond(id, status) : main.respond!(id, status))),
    setReminders:
      main.setReminders &&
      ((id, reminders) =>
        isCaldavCalendarId(id) ? caldav.setReminders(id, reminders) : main.setReminders!(id, reminders)),
    subscribe: main.subscribe && ((listener) => main.subscribe!(listener)),
    listTrash: main.listTrash && ((calendarId) => main.listTrash!(calendarId)),
    restore: main.restore && ((id) => main.restore!(id)),
    purge: main.purge && ((calendarId, id) => main.purge!(calendarId, id)),
    emptyTrash: main.emptyTrash && ((calendarId) => main.emptyTrash!(calendarId)),
  }
}
