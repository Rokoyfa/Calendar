import type { EventColor } from '../../../utils/event.ts'

export type CalendarKind = 'personal' | 'team'

export const TEAM_ROLES = ['owner', 'admin', 'manager', 'editor', 'member', 'contributor', 'viewer'] as const

export type TeamRole = (typeof TEAM_ROLES)[number]

export type CalendarSummary = {
  id: string
  name: string
  color: EventColor
  kind: CalendarKind
  teamName: string | null
  role: TeamRole
  showInPersonal: boolean
}

export type CalendarsContextValue = {
  calendars: readonly CalendarSummary[]
  activeCalendar: CalendarSummary
  visibleCalendarIds: readonly string[]
  selectCalendar: (id: string) => void
  leaveCalendar: (id: string) => Promise<void>
  setShowInPersonal: (id: string, showInPersonal: boolean) => Promise<void>
}
