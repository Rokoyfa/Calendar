import type { EventColor } from '../../../domain/event.ts'
import { useHost } from '../../../context/HostContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { peerCalendarId, usePeerCalendars } from '../../peers/index.ts'
import { getDistinctTeamName, isPersonalCalendar } from '../utils/permissions.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { useCalendars } from './useCalendars.ts'

export type CalendarGroup = 'personal' | 'teams' | 'shared'

export type CalendarOption = {
  id: string
  name: string
  meta: string
  color: EventColor
  isActive: boolean
}

export function useCalendarOptions() {
  const { m } = useI18n()
  const { features } = useHost()
  const { calendars, activeId, activeCalendar, selectCalendar } = useCalendars()
  const peers = usePeerCalendars()
  const activePeerId = peers.calendars.some(({ id }) => peerCalendarId(id) === activeId) ? activeId : null
  const toOption = (calendar: CalendarSummary): CalendarOption => ({
    id: calendar.id,
    name: calendar.name,
    meta: [getDistinctTeamName(calendar), m.calendars.roles[calendar.role]].filter(Boolean).join(' · '),
    color: calendar.color,
    isActive: activePeerId === null && calendar.id === activeCalendar.id,
  })
  const shared = peers.calendars.map((calendar) => ({
    id: peerCalendarId(calendar.id),
    name: m.peers.calendarName(calendar.ownerName),
    meta: m.calendars.indicator.shared,
    color: calendar.color,
    isActive: activePeerId === peerCalendarId(calendar.id),
  }))
  const activeGroup: CalendarGroup =
    activePeerId !== null ? 'shared' : isPersonalCalendar(activeCalendar) ? 'personal' : 'teams'
  return {
    personal: calendars.filter(isPersonalCalendar).map(toOption),
    teams: calendars.filter((calendar) => !isPersonalCalendar(calendar)).map(toOption),
    shared,
    hasTeams: features.teams,
    hasShared: peers.isAvailable || peers.calendars.length > 0,
    activeGroup,
    select: selectCalendar,
  }
}
