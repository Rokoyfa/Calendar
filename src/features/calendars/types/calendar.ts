import type { EventColor } from '../../../utils/event.ts'

export type CalendarKind = 'personal' | 'team'

export const TEAM_ROLES = ['owner', 'admin', 'manager', 'editor', 'member', 'contributor', 'viewer'] as const

export type TeamRole = (typeof TEAM_ROLES)[number]

export type InvitableRole = Exclude<TeamRole, 'owner'>

export type CalendarSummary = {
  id: string
  name: string
  color: EventColor
  kind: CalendarKind
  teamName: string | null
  description: string
  role: TeamRole
  showInPersonal: boolean
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

export type CalendarsContextValue = {
  calendars: readonly CalendarSummary[]
  activeCalendar: CalendarSummary
  visibleCalendarIds: readonly string[]
  selectCalendar: (id: string) => void
  createCalendar: (draft: CalendarDraft) => Promise<CalendarSummary>
  leaveCalendar: (id: string) => Promise<void>
  setShowInPersonal: (id: string, showInPersonal: boolean) => Promise<void>
}
