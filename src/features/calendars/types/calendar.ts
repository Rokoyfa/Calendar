import type { EventColor } from '../../../utils/event.ts'

export type CalendarKind = 'personal' | 'team'

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

export interface CalendarRepository {
  list(): Promise<CalendarSummary[]>
  create(draft: CalendarDraft): Promise<CalendarSummary>
  leave(teamId: string): Promise<void>
  setShowInPersonal(calendarId: string, showInPersonal: boolean): Promise<CalendarSummary>
  listInvitations(): Promise<PendingInvitation[]>
  acceptInvitation(id: string): Promise<CalendarSummary[]>
  declineInvitation(id: string): Promise<void>
}

export type CalendarsContextValue = {
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
}
