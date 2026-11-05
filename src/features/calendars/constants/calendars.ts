import type { CalendarSummary, TeamRole } from '../types/calendar.ts'

export const PERSONAL_CALENDAR: CalendarSummary = {
  id: 'personal',
  name: 'Persönlich',
  color: 'blue',
  kind: 'personal',
  teamName: null,
  role: 'owner',
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
