import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import type { DateRange } from '../../../utils/date.ts'
import { parseCalendarEvent } from '../../../utils/event.ts'
import { requireValue } from '../../../utils/parse.ts'
import {
  parsePeerCalendar,
  parsePeerCalendars,
  parsePeerEvent,
  parsePeerEvents,
  parseSharingState,
  parseSharingViewer,
  toEventRequestInput,
  type EventRequestInput,
  type PeerCalendarChanges,
} from '../../../utils/peerCalendar.ts'
import type { PersonalSharingRepository } from '../types/storage.ts'

const SHARING_PATH = '/personal-sharing'
const PEERS_PATH = '/peer-calendars'

const peerPath = (id: string, ...rest: string[]) =>
  [PEERS_PATH, encodePathSegment(id), ...rest.map(encodePathSegment)].join('/')

export class RemotePersonalSharingRepository implements PersonalSharingRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async getSharing() {
    return parseSharingState(await this.#api.get<unknown>(SHARING_PATH))
  }

  async setSharing(enabled: boolean) {
    return parseSharingState(await this.#api.put<unknown>(SHARING_PATH, { enabled }))
  }

  async invite(email: string) {
    return requireValue(parseSharingViewer(await this.#api.post<unknown>(`${SHARING_PATH}/viewers`, { email })))
  }

  removeViewer(id: string) {
    return this.#api.delete(`${SHARING_PATH}/viewers/${encodePathSegment(id)}`)
  }

  async listPeers() {
    return parsePeerCalendars(await this.#api.get<unknown>(PEERS_PATH))
  }

  async acceptPeer(id: string) {
    return requireValue(parsePeerCalendar(await this.#api.post<unknown>(peerPath(id, 'accept'))))
  }

  async declinePeer(id: string) {
    await this.#api.post<unknown>(peerPath(id, 'decline'))
  }

  async updatePeer(id: string, changes: PeerCalendarChanges) {
    return requireValue(parsePeerCalendar(await this.#api.patch<unknown>(peerPath(id), changes)))
  }

  leavePeer(id: string) {
    return this.#api.delete(peerPath(id))
  }

  async listPeerEvents(id: string, { from, to }: DateRange) {
    return parsePeerEvents(await this.#api.get<unknown>(peerPath(id, 'events'), { query: { from, to } }))
  }

  async createRequest(id: string, input: EventRequestInput) {
    return requireValue(
      parsePeerEvent(await this.#api.post<unknown>(peerPath(id, 'requests'), toEventRequestInput(input))),
    )
  }

  async updateRequest(id: string, eventId: string, input: EventRequestInput) {
    return requireValue(
      parsePeerEvent(await this.#api.put<unknown>(peerPath(id, 'requests', eventId), toEventRequestInput(input))),
    )
  }

  withdrawRequest(id: string, eventId: string) {
    return this.#api.delete(peerPath(id, 'requests', eventId))
  }

  async acceptRequest(eventId: string) {
    return requireValue(
      parseCalendarEvent(await this.#api.post<unknown>(`/events/${encodePathSegment(eventId)}/request/accept`)),
    )
  }

  async declineRequest(eventId: string) {
    await this.#api.post<unknown>(`/events/${encodePathSegment(eventId)}/request/decline`)
  }
}
