import { PERSONAL_CALENDAR_ID } from '../../../config/calendars.ts'
import type { CalendarDraft, CalendarSummary, InvitableRole, TeamRole } from '../types/calendar.ts'

export const CALENDAR_NAME_MAX_LENGTH = 80
export const CALENDAR_DESCRIPTION_MAX_LENGTH = 500
export const MAX_INVITATIONS = 50

export const PERSONAL_CALENDAR: CalendarSummary = {
  id: PERSONAL_CALENDAR_ID,
  teamId: PERSONAL_CALENDAR_ID,
  name: '',
  color: 'blue',
  kind: 'personal',
  teamName: null,
  description: '',
  role: 'owner',
  showInPersonal: true,
  permissions: [
    'read_calendar',
    'manage_calendars',
    'create_entry',
    'update_own_entry',
    'update_any_entry',
    'delete_own_entry',
    'delete_any_entry',
  ],
}

export const EMPTY_CALENDAR_DRAFT: CalendarDraft = {
  name: '',
  description: '',
  color: 'green',
  invitations: [],
}

export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 0,
  admin: 10,
  manager: 20,
  editor: 30,
  member: 40,
  contributor: 50,
  viewer: 60,
}

export const INVITABLE_ROLES: readonly InvitableRole[] = [
  'admin',
  'manager',
  'editor',
  'member',
  'contributor',
  'viewer',
]

export const DEFAULT_INVITATION_ROLE: InvitableRole = 'member'
