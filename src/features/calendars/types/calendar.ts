import type { EventColor } from '../../../utils/event.ts'

type CalendarKind = 'personal' | 'team'

export const TEAM_ROLES = ['owner', 'admin', 'manager', 'editor', 'member', 'contributor', 'viewer'] as const

export type TeamRole = (typeof TEAM_ROLES)[number]

export type InvitableRole = Exclude<TeamRole, 'owner'>

export const PERMISSIONS = [
  'read_calendar',
  'manage_calendars',
  'create_entry',
  'update_own_entry',
  'update_any_entry',
  'delete_own_entry',
  'delete_any_entry',
  'invite_members',
  'manage_members',
  'manage_team',
  'delete_team',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export type CalendarSummary = {
  id: string
  teamId: string
  name: string
  color: EventColor
  kind: CalendarKind
  teamName: string | null
  description: string
  role: TeamRole
  showInPersonal: boolean
  permissions: readonly Permission[]
}

export type Invitation = {
  email: string
  role: InvitableRole
}

export type CalendarDraft = {
  name: string
  description: string
  color: EventColor
  invitations: Invitation[]
}

export type PendingInvitation = {
  id: string
  teamId: string
  teamName: string
  description: string
  role: InvitableRole
  invitedBy: string | null
  expiresAt: string
}

export type TeamMember = {
  userId: string
  name: string
  email: string
  role: TeamRole
  joinedAt: string
}

export type TeamInvitation = PendingInvitation & { email: string }

export type CalendarChanges = Pick<CalendarSummary, 'name' | 'color'>

export type TeamChanges = { name: string; description: string }

export interface CalendarRepository {
  list(): Promise<CalendarSummary[]>
  create(draft: CalendarDraft): Promise<CalendarSummary>
  leave(teamId: string): Promise<void>
  setShowInPersonal(calendarId: string, showInPersonal: boolean): Promise<CalendarSummary>
  listInvitations(): Promise<PendingInvitation[]>
  acceptInvitation(id: string): Promise<CalendarSummary[]>
  declineInvitation(id: string): Promise<void>
  updateCalendar(calendarId: string, changes: CalendarChanges): Promise<CalendarSummary>
  updateTeam(teamId: string, changes: TeamChanges): Promise<CalendarSummary[]>
  deleteTeam(teamId: string): Promise<void>
  transferOwnership(teamId: string, userId: string): Promise<CalendarSummary[]>
  listMembers(teamId: string): Promise<TeamMember[]>
  changeMemberRole(teamId: string, userId: string, role: TeamRole): Promise<TeamMember>
  removeMember(teamId: string, userId: string): Promise<void>
  listTeamInvitations(teamId: string): Promise<TeamInvitation[]>
  invite(teamId: string, invitation: Invitation): Promise<TeamInvitation>
  revokeInvitation(teamId: string, invitationId: string): Promise<void>
}

export type CalendarsContextValue = {
  repository: CalendarRepository
  isLoading: boolean
  calendars: readonly CalendarSummary[]
  invitations: readonly PendingInvitation[]
  error: string | null
  activeCalendar: CalendarSummary
  visibleCalendarIds: readonly string[]
  selectCalendar: (id: string) => void
  createCalendar: (draft: CalendarDraft) => Promise<CalendarSummary>
  leaveCalendar: (id: string) => Promise<void>
  setShowInPersonal: (id: string, showInPersonal: boolean) => Promise<void>
  acceptInvitation: (id: string) => Promise<void>
  declineInvitation: (id: string) => Promise<void>
  updateCalendar: (calendar: CalendarSummary, changes: CalendarChanges) => Promise<void>
  updateTeam: (calendar: CalendarSummary, changes: TeamChanges) => Promise<void>
  deleteTeam: (calendar: CalendarSummary) => Promise<void>
  transferOwnership: (calendar: CalendarSummary, userId: string) => Promise<void>
}
