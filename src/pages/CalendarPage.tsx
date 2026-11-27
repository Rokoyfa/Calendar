import { useCallback, useMemo } from 'react'
import { AccountMenu, EmailVerificationBanner, useAuth } from '../features/authorization/index.ts'
import { Calendar } from '../features/calendar/index.ts'
import type { ChatAccess } from '../features/chat/index.ts'
import {
  ActiveCalendarIndicator,
  CalendarSwitcher,
  canManageCategories,
  getDistinctTeamName,
  getSharedCalendars,
  hasPermission,
  isPersonalCalendar,
  useCalendars,
} from '../features/calendars/index.ts'
import { usePreferences } from '../features/preferences/index.ts'
import { LocalImportPrompt } from '../features/storage/index.ts'
import { useI18n } from '../i18n/index.ts'
import { useHost } from '../context/HostContext.ts'
import { useRootElement } from '../context/RootElementContext.ts'
import { nearestView } from '../domain/calendarView.ts'
import { getStartView, isCompactWidth } from '../domain/preferences.ts'
import { useExternalCalendars, externalCalendarId } from '../features/external/index.ts'
import { NotificationBell } from '../features/notifications/index.ts'
import { useCaldav, caldavCalendarId } from '../features/caldav/index.ts'
import { usePeerCalendars, peerCalendarId } from '../features/peers/index.ts'
import { useCalendarLink } from './calendar/useCalendarLink.ts'
import { useCalendarMenu } from './calendar/useCalendarMenu.tsx'
import { useEventPermissions } from './calendar/useEventPermissions.ts'
import { useTaskSetup } from './calendar/useTaskSetup.ts'

export function CalendarPage() {
  const root = useRootElement()
  const host = useHost()
  const { enabled, method, user } = useAuth()
  const hasAccountMenu = enabled && (user !== null || method === 'password')
  const { preferences } = usePreferences()
  const { m } = useI18n()
  const { calendars, activeCalendar, activeId, visibleCalendarIds, repository, selectCalendar } = useCalendars()
  const peers = usePeerCalendars()
  const activePeer = peers.calendars.find(({ id }) => peerCalendarId(id) === activeId) ?? null
  const canOpenSettings = !(enabled && method === 'password' && !user)
  const menuItems = useCalendarMenu({ activeCalendar, isPeer: activePeer !== null, canOpenSettings, hasAccountMenu })
  const link = useCalendarLink(calendars, selectCalendar)

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars])
  const isTeamCalendar = useCallback(
    (calendarId: string) => {
      const calendar = calendarById.get(calendarId)
      return Boolean(calendar && !isPersonalCalendar(calendar))
    },
    [calendarById],
  )
  const userId = user?.id ?? null
  const chatAccess = useMemo<ChatAccess | undefined>(() => {
    if (!host.features.chat || !user) return undefined
    return {
      currentUserId: user.id,
      isAvailable: isTeamCalendar,
      canModerate: (calendarId) => {
        const calendar = calendarById.get(calendarId)
        return Boolean(calendar && hasPermission(calendar, 'manage_calendars'))
      },
    }
  }, [host.features.chat, user, isTeamCalendar, calendarById])
  const loadAttendeeCandidates = useMemo(() => {
    if (!host.features.attendees || !user) return undefined
    return async (calendarId: string) => {
      const calendar = calendarById.get(calendarId)
      if (!calendar || isPersonalCalendar(calendar)) return []
      const members = await repository.listMembers(calendar.teamId)
      return members.map(({ email, name }) => ({ email, name }))
    }
  }, [host.features.attendees, user, calendarById, repository])
  const external = useExternalCalendars()
  const caldav = useCaldav()
  const caldavById = useMemo(
    () => new Map(caldav.calendars.map((calendar) => [caldavCalendarId(calendar.id), calendar])),
    [caldav.calendars],
  )
  const showsPeers = isPersonalCalendar(activeCalendar)
  const shownPeers = useMemo(
    () => (showsPeers ? peers.calendars.filter((calendar) => calendar.shown) : []),
    [showsPeers, peers.calendars],
  )
  const calendarIds = useMemo(() => {
    const shown = [
      ...caldav.calendars.filter((calendar) => calendar.shown).map(({ id }) => caldavCalendarId(id)),
      ...shownPeers.map(({ id }) => peerCalendarId(id)),
    ]
    if (activePeer) return [peerCalendarId(activePeer.id)]
    return shown.length > 0 ? [...visibleCalendarIds, ...shown] : visibleCalendarIds
  }, [visibleCalendarIds, caldav.calendars, shownPeers, activePeer])
  const eventSources = useMemo(
    () =>
      new Map([
        ...getSharedCalendars(calendars, activeCalendar).map(({ id, name, color }) => [id, { name, color }] as const),
        ...external.calendars.map(({ id, name, color }) => [externalCalendarId(id), { name, color }] as const),
        ...[...caldavById].map(([id, { name, color }]) => [id, { name, color }] as const),
        ...peers.calendars.map(
          ({ id, ownerName, color }) => [peerCalendarId(id), { name: m.peers.calendarName(ownerName), color }] as const,
        ),
      ]),
    [calendars, activeCalendar, external.calendars, caldavById, peers.calendars, m],
  )

  const initialView =
    host.initialView ?? nearestView(getStartView(preferences, isCompactWidth(root.clientWidth)), host.views)

  const { canEditEvent: mayEditEvent, canMoveEvent: mayMoveEvent } = useEventPermissions(
    calendarById,
    caldavById,
    userId,
  )
  const mayManageCategories = useCallback(
    (calendarId: string) => {
      const calendar = calendarById.get(calendarId)
      return calendar !== undefined && canManageCategories(calendar)
    },
    [calendarById],
  )
  const calendarNames = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar.name])), [calendars])
  const ownChoices = useMemo(
    () =>
      calendars
        .filter((calendar) => hasPermission(calendar, 'create_entry'))
        .toSorted((a, b) => Number(b.id === activeCalendar.id) - Number(a.id === activeCalendar.id))
        .map((calendar) => {
          const team = getDistinctTeamName(calendar)
          return { id: calendar.id, name: team ? `${calendar.name} (${team})` : calendar.name }
        }),
    [calendars, activeCalendar],
  )
  const calendarChoices = useMemo(() => {
    const remote = caldav.calendars
      .filter((calendar) => calendar.shown && !calendar.readOnly)
      .map((calendar) => ({ id: caldavCalendarId(calendar.id), name: `${calendar.name} (${calendar.accountName})` }))
    const requests = shownPeers.map((calendar) => ({
      id: peerCalendarId(calendar.id),
      name: m.peers.requestChoice(calendar.ownerName),
    }))
    if (activePeer) return [{ id: peerCalendarId(activePeer.id), name: m.peers.requestChoice(activePeer.ownerName) }]
    return [...ownChoices, ...remote, ...requests]
  }, [ownChoices, caldav.calendars, shownPeers, activePeer, m])
  const canSetVisibility = useCallback(
    (calendarId: string) => {
      const calendar = calendarById.get(calendarId)
      return Boolean(calendar && isPersonalCalendar(calendar))
    },
    [calendarById],
  )

  const busyCalendarIds = useMemo(
    () => [
      ...caldav.calendars.map(({ id }) => caldavCalendarId(id)),
      ...peers.calendars.map(({ id }) => peerCalendarId(id)),
    ],
    [caldav.calendars, peers.calendars],
  )
  const isLinkedCalendarShown = !link.calendarId || visibleCalendarIds.includes(link.calendarId)
  const tasks = useTaskSetup({
    calendarById,
    choices: ownChoices,
    calendarNames,
    busyCalendarIds,
    externalEvents: external.events,
    openTaskId: isLinkedCalendarShown ? link.taskId : null,
    openTaskPlan: link.plan,
    onOpenTaskDone: link.clear,
  })

  return (
    <div className="app">
      <EmailVerificationBanner />
      <Calendar
        calendarIds={calendarIds}
        targetCalendarId={activePeer ? peerCalendarId(activePeer.id) : activeCalendar.id}
        canCreate={activePeer !== null || hasPermission(activeCalendar, 'create_entry')}
        calendarChoices={calendarChoices}
        canMoveEvent={mayMoveEvent}
        eventSources={eventSources}
        calendarNames={calendarNames}
        canManageCategories={mayManageCategories}
        canEditEvent={mayEditEvent}
        currentUserId={userId}
        initialView={initialView}
        tips={{
          scope: user?.id ?? 'guest',
          canSwitch: calendars.length + peers.calendars.length > 1 || (host.features.teams && user !== null),
        }}
        headerContext={
          <ActiveCalendarIndicator
            shared={
              activePeer ? { name: m.peers.calendarName(activePeer.ownerName), color: activePeer.color } : undefined
            }
          />
        }
        currentUserEmail={user?.email ?? null}
        loadAttendeeCandidates={loadAttendeeCandidates}
        chat={chatAccess}
        externalEvents={external.events}
        isHistoryAvailable={isTeamCalendar}
        canSetVisibility={canSetVisibility}
        openEvent={link.openEvent}
        onOpenEventDone={link.clear}
        menuItems={menuItems}
        tasks={activePeer ? undefined : tasks}
        headerAccessory={
          <>
            <NotificationBell />
            <AccountMenu
              menuItems={host.features.teams || peers.calendars.length > 0 ? <CalendarSwitcher /> : undefined}
            />
          </>
        }
      />
      {user && <LocalImportPrompt userId={user.id} />}
    </div>
  )
}
