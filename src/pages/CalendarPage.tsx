import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { BookingIcon, SettingsIcon, ShareIcon, SwapIcon, TeamIcon, TrashIcon } from '../components/Icons.tsx'
import { calendarSettingsPath, ROUTES } from '../config/routes.ts'
import { AccountMenu, EmailVerificationBanner, useAuth } from '../features/authorization/index.ts'
import { Calendar, type CalendarMenuItem, type OpenEventRequest } from '../features/calendar/index.ts'
import { compact } from '../utils/list.ts'
import type { ChatAccess } from '../features/chat/index.ts'
import { isISODate } from '../utils/date.ts'
import {
  ActiveCalendarIndicator,
  type CalendarSummary,
  CalendarSwitcher,
  canDeleteEntry,
  canEditEntry,
  canManageCategories,
  getDistinctTeamName,
  getSharedCalendars,
  hasPermission,
  isPersonalCalendar,
  useCalendars,
  useCalendarSettingsTabs,
} from '../features/calendars/index.ts'
import type { CalendarEvent } from '../utils/event.ts'
import { usePreferences } from '../features/preferences/index.ts'
import { LocalImportPrompt } from '../features/storage/index.ts'
import { useI18n } from '../i18n/index.ts'
import { useHost } from '../context/HostContext.ts'
import { useRootElement } from '../context/RootElementContext.ts'
import { nearestView } from '../utils/calendarView.ts'
import { getStartView, isCompactWidth } from '../utils/preferences.ts'
import { useExternalCalendars } from '../features/external/index.ts'
import { externalCalendarId, isExternalEvent } from '../utils/externalCalendar.ts'
import { NotificationBell } from '../features/notifications/index.ts'
import { useCaldav } from '../features/caldav/index.ts'
import { caldavCalendarId, isCaldavEvent } from '../utils/caldav.ts'
import { usePeerCalendars } from '../features/peers/index.ts'
import { isOwnPendingRequest, isPeerEvent, peerCalendarId } from '../utils/peerCalendar.ts'
import type { TaskAccess, TaskSetup } from '../features/tasks/index.ts'

const LINK_PARAMS = {
  calendar: 'calendar',
  event: 'event',
  date: 'date',
  tab: 'tab',
  task: 'task',
} as const

export function CalendarPage() {
  const root = useRootElement()
  const host = useHost()
  const { enabled, method, user } = useAuth()
  const hasAccountMenu = enabled && (user !== null || method === 'password')
  const { preferences } = usePreferences()
  const { m } = useI18n()
  const { calendars, activeCalendar, visibleCalendarIds, repository, selectCalendar } = useCalendars()
  const settingsTabs = useCalendarSettingsTabs(activeCalendar)
  const canOpenSettings = !(enabled && method === 'password' && !user)
  const menuItems = (() => {
    if (!canOpenSettings) return []
    const path = calendarSettingsPath(activeCalendar.id)
    const tab = (name: string) => `${path}?tab=${name}`
    const { tabs } = m.calendars.settings
    const group = m.calendar.menu.calendarGroup(activeCalendar.name)
    return compact<CalendarMenuItem>([
      !hasAccountMenu && {
        key: 'settings',
        label: m.common.settings,
        icon: <SettingsIcon size={18} />,
        to: ROUTES.settings,
      },
      {
        key: 'calendarSettings',
        group,
        label: m.calendar.menu.calendarSettings,
        icon: <SettingsIcon size={18} />,
        to: path,
      },
      settingsTabs.members && {
        key: 'members',
        group,
        label: tabs.members,
        icon: <TeamIcon size={18} />,
        to: tab('members'),
      },
      settingsTabs.sharing && {
        key: 'sharing',
        group,
        label: tabs.sharing,
        icon: <ShareIcon size={18} />,
        to: tab('sharing'),
      },
      settingsTabs.booking && {
        key: 'booking',
        group,
        label: tabs.booking,
        icon: <BookingIcon size={18} />,
        to: tab('booking'),
      },
      settingsTabs.exchange && {
        key: 'exchange',
        group,
        label: tabs.exchange,
        icon: <SwapIcon size={18} />,
        to: tab('exchange'),
      },
      settingsTabs.trash && { key: 'trash', group, label: tabs.trash, icon: <TrashIcon size={18} />, to: tab('trash') },
    ])
  })()
  const [searchParams, setSearchParams] = useSearchParams()
  const linkedCalendarId = searchParams.get(LINK_PARAMS.calendar)
  const linkedEventId = searchParams.get(LINK_PARAMS.event)
  const linkedDate = searchParams.get(LINK_PARAMS.date)
  const linkedTab = searchParams.get(LINK_PARAMS.tab)
  const linkedTaskId = searchParams.get(LINK_PARAMS.task)
  const openEvent = useMemo<OpenEventRequest | undefined>(
    () =>
      linkedEventId && isISODate(linkedDate)
        ? {
            eventId: linkedEventId,
            date: linkedDate,
            tab: linkedTab === 'chat' && host.features.chat ? 'chat' : undefined,
          }
        : undefined,
    [linkedEventId, linkedDate, linkedTab, host.features.chat],
  )
  const linkedCalendarExists = calendars.some((calendar) => calendar.id === linkedCalendarId)

  useEffect(() => {
    if (linkedCalendarId && linkedCalendarExists) selectCalendar(linkedCalendarId)
  }, [linkedCalendarId, linkedCalendarExists, selectCalendar])

  const clearLink = useCallback(
    () =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const param of Object.values(LINK_PARAMS)) next.delete(param)
          return next
        },
        { replace: true },
      ),
    [setSearchParams],
  )

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
  const peers = usePeerCalendars()
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
    return shown.length > 0 ? [...visibleCalendarIds, ...shown] : visibleCalendarIds
  }, [visibleCalendarIds, caldav.calendars, shownPeers])
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

  const eventAccess = useCallback(
    (event: CalendarEvent, check: (calendar: CalendarSummary) => boolean, unknownCalendar: boolean) => {
      if (isExternalEvent(event)) return false
      if (isPeerEvent(event)) return isOwnPendingRequest(event)
      if (isCaldavEvent(event)) return caldavById.get(event.calendarId)?.readOnly === false
      const calendar = calendarById.get(event.calendarId)
      return calendar ? check(calendar) : unknownCalendar
    },
    [calendarById, caldavById],
  )
  const mayEditEvent = useCallback(
    (event: CalendarEvent) => eventAccess(event, (calendar) => canEditEntry(calendar, event.createdBy, userId), true),
    [eventAccess, userId],
  )
  const mayMoveEvent = useCallback(
    (event: CalendarEvent) =>
      eventAccess(event, (calendar) => canDeleteEntry(calendar, event.createdBy, userId), false),
    [eventAccess, userId],
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
    return [...ownChoices, ...remote, ...requests]
  }, [ownChoices, caldav.calendars, shownPeers, m])
  const canSetVisibility = useCallback(
    (calendarId: string) => {
      const calendar = calendarById.get(calendarId)
      return Boolean(calendar && isPersonalCalendar(calendar))
    },
    [calendarById],
  )

  const taskAccess = useMemo<TaskAccess>(() => {
    const check = (calendarId: string, allowed: (calendar: CalendarSummary) => boolean) => {
      const calendar = calendarById.get(calendarId)
      return calendar !== undefined && allowed(calendar)
    }
    const canEdit: TaskAccess['canEdit'] = (task) =>
      check(task.calendarId, (calendar) => canEditEntry(calendar, task.createdBy, userId))
    return {
      canCreateIn: (calendarId) => check(calendarId, (calendar) => hasPermission(calendar, 'create_entry')),
      canEdit,
      canComplete: (task) =>
        canEdit(task) || (userId !== null && task.assignee?.id === userId && calendarById.has(task.calendarId)),
      canDelete: (task) => check(task.calendarId, (calendar) => canDeleteEntry(calendar, task.createdBy, userId)),
    }
  }, [calendarById, userId])
  const loadAssignees = useMemo(() => {
    if (!user || !host.features.teams) return undefined
    return async (calendarId: string) => {
      const calendar = calendarById.get(calendarId)
      if (!calendar || isPersonalCalendar(calendar)) return []
      const members = await repository.listMembers(calendar.teamId)
      return members.map(({ userId: id, name }) => ({ id, name }))
    }
  }, [user, host.features.teams, calendarById, repository])
  const isLinkedCalendarShown = !linkedCalendarId || visibleCalendarIds.includes(linkedCalendarId)
  const tasks = useMemo<TaskSetup>(
    () => ({
      calendarIds: visibleCalendarIds,
      targetCalendarId: activeCalendar.id,
      choices: ownChoices,
      calendarNames,
      access: taskAccess,
      loadAssignees,
      openTaskId: isLinkedCalendarShown ? linkedTaskId : null,
      onOpenTaskDone: clearLink,
    }),
    [
      visibleCalendarIds,
      activeCalendar.id,
      ownChoices,
      calendarNames,
      taskAccess,
      loadAssignees,
      isLinkedCalendarShown,
      linkedTaskId,
      clearLink,
    ],
  )

  return (
    <div className="app">
      <EmailVerificationBanner />
      <Calendar
        calendarIds={calendarIds}
        targetCalendarId={activeCalendar.id}
        canCreate={hasPermission(activeCalendar, 'create_entry')}
        calendarChoices={calendarChoices}
        canMoveEvent={mayMoveEvent}
        eventSources={eventSources}
        calendarNames={calendarNames}
        canManageCategories={mayManageCategories}
        canEditEvent={mayEditEvent}
        currentUserId={userId}
        initialView={initialView}
        headerContext={<ActiveCalendarIndicator />}
        currentUserEmail={user?.email ?? null}
        loadAttendeeCandidates={loadAttendeeCandidates}
        chat={chatAccess}
        externalEvents={external.events}
        isHistoryAvailable={isTeamCalendar}
        canSetVisibility={canSetVisibility}
        openEvent={openEvent}
        onOpenEventDone={clearLink}
        menuItems={menuItems}
        tasks={tasks}
        headerAccessory={
          <>
            <NotificationBell />
            <AccountMenu menuItems={host.features.teams ? <CalendarSwitcher /> : undefined} />
          </>
        }
      />
      {user && <LocalImportPrompt userId={user.id} />}
    </div>
  )
}
