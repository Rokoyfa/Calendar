import { PERSONAL_CALENDAR_ID } from '../../../config/calendars.ts'
import type { CalendarDraft, CalendarSummary, InvitableRole, TeamRole } from '../types/calendar.ts'

export const CALENDAR_NAME_MAX_LENGTH = 80
export const CALENDAR_DESCRIPTION_MAX_LENGTH = 500
export const MAX_INVITATIONS = 50

export const PERSONAL_CALENDAR: CalendarSummary = {
  id: PERSONAL_CALENDAR_ID,
  name: 'Persönlich',
  color: 'blue',
  kind: 'personal',
  teamName: null,
  description: '',
  role: 'owner',
  showInPersonal: true,
}

export const EMPTY_CALENDAR_DRAFT: CalendarDraft = {
  name: '',
  description: '',
  color: 'green',
  invitations: [],
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  manager: 'Verwalter',
  editor: 'Redakteur',
  member: 'Mitglied',
  contributor: 'Beitragender',
  viewer: 'Betrachter',
}

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: 'Leitet den Kalender und hat immer alle Rechte.',
  admin: 'Verwaltet Kalender, Mitglieder und alle Termine. Kann den Kalender nicht löschen.',
  manager: 'Verwaltet den Kalender und alle Termine und lädt neue Mitglieder ein.',
  editor: 'Legt Termine an und bearbeitet und löscht alle Termine.',
  member: 'Legt Termine an und bearbeitet und löscht die eigenen.',
  contributor: 'Legt Termine an und bearbeitet die eigenen, löscht aber nichts.',
  viewer: 'Sieht den Kalender, ändert aber nichts.',
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
