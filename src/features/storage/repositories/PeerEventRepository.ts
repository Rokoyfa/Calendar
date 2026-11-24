import { AppError } from '../../../utils/appError.ts'
import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import {
  isPeerCalendarId,
  parsePeerEventId,
  shareIdOf,
  toPeerCalendarEvent,
  type PeerCalendar,
} from '../../../utils/peerCalendar.ts'
import type { EventQuery, EventRepository, PeerEventSource, PersonalSharingRepository } from '../types/storage.ts'

export class PeerEventRepository implements PeerEventSource {
  readonly #api: PersonalSharingRepository
  #busyTitle = ''
  #calendars = new Map<string, PeerCalendar>()

  constructor(api: PersonalSharingRepository) {
    this.#api = api
  }

  setBusyTitle(title: string) {
    this.#busyTitle = title
  }

  setCalendars(calendars: readonly PeerCalendar[]) {
    this.#calendars = new Map(
      calendars.filter((calendar) => calendar.status === 'accepted').map((calendar) => [calendar.id, calendar]),
    )
  }

  #calendar(shareId: string | null) {
    const calendar = shareId ? this.#calendars.get(shareId) : undefined
    if (!calendar) throw new AppError('sharedCalendarNotFound')
    return calendar
  }

  #event(id: string) {
    const ref = parsePeerEventId(id)
    if (!ref) throw new AppError('requestNotFound')
    return { calendar: this.#calendar(ref.shareId), eventId: ref.eventId }
  }

  async list({ from, to, calendarIds }: EventQuery): Promise<CalendarEvent[]> {
    const calendars = calendarIds.flatMap((id) => {
      const calendar = this.#calendars.get(shareIdOf(id) ?? '')
      return calendar ? [calendar] : []
    })
    const lists = await Promise.all(
      calendars.map(async (calendar) =>
        (await this.#api.listPeerEvents(calendar.id, { from, to })).map((event) =>
          toPeerCalendarEvent(calendar, event, this.#busyTitle),
        ),
      ),
    )
    return lists.flat()
  }

  async create(calendarId: string, input: EventInput) {
    const calendar = this.#calendar(shareIdOf(calendarId))
    return toPeerCalendarEvent(calendar, await this.#api.createRequest(calendar.id, input), this.#busyTitle)
  }

  async update(id: string, input: EventInput) {
    const { calendar, eventId } = this.#event(id)
    return toPeerCalendarEvent(calendar, await this.#api.updateRequest(calendar.id, eventId, input), this.#busyTitle)
  }

  async remove(id: string) {
    const { calendar, eventId } = this.#event(id)
    await this.#api.withdrawRequest(calendar.id, eventId)
  }
}

const forbidden = () => Promise.reject(new AppError('forbidden'))

const withoutPeers = (calendarIds: readonly string[]) => calendarIds.filter((id) => !isPeerCalendarId(id))

export const withPeerEvents = (main: EventRepository, peers: PeerEventRepository): EventRepository => ({
  async list(query) {
    const own = withoutPeers(query.calendarIds)
    const hasPeers = own.length < query.calendarIds.length
    const [mainEvents, peerEvents] = await Promise.all([
      own.length > 0 || !hasPeers ? main.list({ ...query, calendarIds: own }) : [],
      hasPeers ? peers.list(query) : [],
    ])
    return peerEvents.length > 0 ? [...mainEvents, ...peerEvents] : mainEvents
  },
  listSeries: (seriesId) => (isPeerCalendarId(seriesId) ? Promise.resolve([]) : main.listSeries(seriesId)),
  create: (calendarId, input) =>
    isPeerCalendarId(calendarId) ? peers.create(calendarId, input) : main.create(calendarId, input),
  update: (id, input, version) => (isPeerCalendarId(id) ? peers.update(id, input) : main.update(id, input, version)),
  remove: (id, version) => (isPeerCalendarId(id) ? peers.remove(id) : main.remove(id, version)),
  move:
    main.move &&
    ((id, calendarId, version) =>
      isPeerCalendarId(id) || isPeerCalendarId(calendarId) ? forbidden() : main.move!(id, calendarId, version)),
  search:
    main.search &&
    ((query) => {
      const calendarIds = withoutPeers(query.calendarIds)
      return calendarIds.length > 0 ? main.search!({ ...query, calendarIds }) : Promise.resolve([])
    }),
  respond: main.respond && ((id, status) => (isPeerCalendarId(id) ? forbidden() : main.respond!(id, status))),
  setReminders:
    main.setReminders && ((id, reminders) => (isPeerCalendarId(id) ? forbidden() : main.setReminders!(id, reminders))),
  subscribe: main.subscribe && ((listener) => main.subscribe!(listener)),
  listTrash: main.listTrash && ((calendarId) => main.listTrash!(calendarId)),
  restore:
    main.restore &&
    ((id) => (isPeerCalendarId(id) ? Promise.reject(new AppError('eventNotFound')) : main.restore!(id))),
  purge: main.purge && ((calendarId, id) => main.purge!(calendarId, id)),
  emptyTrash: main.emptyTrash && ((calendarId) => main.emptyTrash!(calendarId)),
})
