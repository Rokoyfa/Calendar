import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import type { CalendarDraft, CalendarRepository, CalendarSummary, PendingInvitation } from '../types/calendar.ts'

const segment = encodePathSegment

export class RemoteCalendarRepository implements CalendarRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  list() {
    return this.#api.get<CalendarSummary[]>('/calendars')
  }

  create({ name, description, color, invitations }: CalendarDraft) {
    return this.#api.post<CalendarSummary>('/calendars', { name, description, color, invitations })
  }

  leave(teamId: string) {
    return this.#api.delete(`/teams/${segment(teamId)}/membership`)
  }

  setShowInPersonal(calendarId: string, showInPersonal: boolean) {
    return this.#api.put<CalendarSummary>(`/calendars/${segment(calendarId)}/settings`, { showInPersonal })
  }

  listInvitations() {
    return this.#api.get<PendingInvitation[]>('/invitations')
  }

  acceptInvitation(id: string) {
    return this.#api.post<CalendarSummary[]>(`/invitations/${segment(id)}/accept`)
  }

  declineInvitation(id: string) {
    return this.#api.post<void>(`/invitations/${segment(id)}/decline`)
  }
}
