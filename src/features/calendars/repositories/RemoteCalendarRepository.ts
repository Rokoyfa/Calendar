import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import type {
  CalendarChanges,
  CalendarDraft,
  CalendarRepository,
  CalendarSummary,
  Invitation,
  PendingInvitation,
  TeamChanges,
  TeamInvitation,
  TeamMember,
  TeamRole,
} from '../types/calendar.ts'

const segment = encodePathSegment

const teamPath = (teamId: string, ...rest: string[]) =>
  ['/teams', teamId, ...rest].map((part, index) => (index === 0 ? part : segment(part))).join('/')

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
    return this.#api.delete(teamPath(teamId, 'membership'))
  }

  updateCalendar(calendarId: string, changes: CalendarChanges) {
    return this.#api.patch<CalendarSummary>(`/calendars/${segment(calendarId)}`, changes)
  }

  updateTeam(teamId: string, changes: TeamChanges) {
    return this.#api.patch<CalendarSummary[]>(teamPath(teamId), changes)
  }

  deleteTeam(teamId: string) {
    return this.#api.delete(teamPath(teamId))
  }

  listMembers(teamId: string) {
    return this.#api.get<TeamMember[]>(teamPath(teamId, 'members'))
  }

  changeMemberRole(teamId: string, userId: string, role: TeamRole) {
    return this.#api.patch<TeamMember>(teamPath(teamId, 'members', userId), { role })
  }

  removeMember(teamId: string, userId: string) {
    return this.#api.delete(teamPath(teamId, 'members', userId))
  }

  listTeamInvitations(teamId: string) {
    return this.#api.get<TeamInvitation[]>(teamPath(teamId, 'invitations'))
  }

  invite(teamId: string, invitation: Invitation) {
    return this.#api.post<TeamInvitation>(teamPath(teamId, 'invitations'), invitation)
  }

  revokeInvitation(teamId: string, invitationId: string) {
    return this.#api.delete(teamPath(teamId, 'invitations', invitationId))
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
