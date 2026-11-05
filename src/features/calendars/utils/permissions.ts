import { INVITABLE_ROLES, ROLE_HIERARCHY } from '../constants/calendars.ts'
import { TEAM_ROLES, type CalendarSummary, type Permission, type TeamRole } from '../types/calendar.ts'

export const isPersonalCalendar = ({ kind }: CalendarSummary) => kind === 'personal'

export const canLeaveCalendar = (calendar: CalendarSummary) =>
  !isPersonalCalendar(calendar) && calendar.role !== 'owner'

export const getVisibleCalendarIds = (calendars: readonly CalendarSummary[], active: CalendarSummary) =>
  isPersonalCalendar(active)
    ? calendars.filter((calendar) => isPersonalCalendar(calendar) || calendar.showInPersonal).map(({ id }) => id)
    : [active.id]

export const hasPermission = (calendar: CalendarSummary, permission: Permission) =>
  calendar.permissions.includes(permission)

export const getSharedCalendars = (calendars: readonly CalendarSummary[], active: CalendarSummary) =>
  isPersonalCalendar(active)
    ? calendars.filter((calendar) => !isPersonalCalendar(calendar) && calendar.showInPersonal)
    : []

export const outranks = (actor: TeamRole, target: TeamRole) =>
  actor === 'owner' || ROLE_HIERARCHY[actor] < ROLE_HIERARCHY[target]

export const getAssignableRoles = (actor: TeamRole) =>
  TEAM_ROLES.filter((role) => (role !== 'owner' ? outranks(actor, role) : actor === 'owner'))

export const getInvitableRoles = (actor: TeamRole) => INVITABLE_ROLES.filter((role) => outranks(actor, role))

const SETTINGS_PERMISSIONS: readonly Permission[] = [
  'manage_calendars',
  'manage_team',
  'invite_members',
  'manage_members',
  'delete_team',
]

export const canOpenSettings = (calendar: CalendarSummary) =>
  SETTINGS_PERMISSIONS.some((permission) => hasPermission(calendar, permission))
