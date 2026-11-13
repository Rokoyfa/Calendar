import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SettingsIcon } from '../components/Icons.tsx'
import { ROUTES } from '../config/routes.ts'
import { AccountMenu, EmailVerificationBanner, useAuth } from '../features/authorization/index.ts'
import { Calendar, type OpenEventRequest } from '../features/calendar/index.ts'
import type { ChatAccess } from '../features/chat/index.ts'
import { isISODate } from '../utils/date.ts'
import {
  ActiveCalendarIndicator,
  CalendarSwitcher,
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
import { nearestView } from '../utils/calendarView.ts'
import { getStartView, isCompactWidth } from '../utils/preferences.ts'

const LINK_PARAMS = {
  calendar: 'calendar',
  event: 'event',
  date: 'date',
  tab: 'tab',
} as const

export function CalendarPage() {
  const root = useRootElement()
  const host = useHost()
  const { enabled, method, user } = useAuth()
  const hasAccountMenu = enabled && (user !== null || method === 'password')
  const { preferences } = usePreferences()
  const { m } = useI18n()
  const { calendars, activeCalendar, visibleCalendarIds, repository, selectCalendar } = useCalendars()
  const [searchParams, setSearchParams] = useSearchParams()
  const linkedCalendarId = searchParams.get(LINK_PARAMS.calendar)
  const linkedEventId = searchParams.get(LINK_PARAMS.event)
  const linkedDate = searchParams.get(LINK_PARAMS.date)
  const linkedTab = searchParams.get(LINK_PARAMS.tab)
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

  const clearLink = () =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const param of Object.values(LINK_PARAMS)) next.delete(param)
        return next
      },
      { replace: true },
    )

  const chatAccess = useMemo<ChatAccess | undefined>(() => {
    if (!host.features.chat || !user) return undefined
    const find = (calendarId: string) => calendars.find((calendar) => calendar.id === calendarId)
    return {
      currentUserId: user.id,
      isAvailable: (calendarId) => {
        const calendar = find(calendarId)
        return Boolean(calendar && !isPersonalCalendar(calendar))
      },
      canModerate: (calendarId) => {
        const calendar = find(calendarId)
        return Boolean(calendar && hasPermission(calendar, 'manage_calendars'))
      },
    }
  }, [host.features.chat, user, calendars])
  const loadAttendeeCandidates = useMemo(() => {
    if (!host.features.attendees || !user) return undefined
    return async (calendarId: string) => {
      const calendar = calendars.find((entry) => entry.id === calendarId)
      if (!calendar || isPersonalCalendar(calendar)) return []
      const members = await repository.listMembers(calendar.teamId)
      return members.map(({ email, name }) => ({ email, name }))
    }
  }, [host.features.attendees, user, calendars, repository])
  const eventSources = useMemo(
    () => new Map(getSharedCalendars(calendars, activeCalendar).map(({ id, name, color }) => [id, { name, color }])),
    [calendars, activeCalendar],
  )
  const initialView =
    host.initialView ?? nearestView(getStartView(preferences, isCompactWidth(root.clientWidth)), host.views)

  const calendarNames = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar.name])), [calendars])

  return (
    <div className="app">
      <EmailVerificationBanner />
      <Calendar
        calendarIds={visibleCalendarIds}
        targetCalendarId={activeCalendar.id}
        canCreate={hasPermission(activeCalendar, 'create_entry')}
        eventSources={eventSources}
        calendarNames={calendarNames}
        initialView={initialView}
        headerContext={<ActiveCalendarIndicator />}
        currentUserEmail={user?.email ?? null}
        loadAttendeeCandidates={loadAttendeeCandidates}
        chat={chatAccess}
        openEvent={openEvent}
        onOpenEventDone={clearLink}
        headerAccessory={
          <>
            {!hasAccountMenu && (
              <Link to={ROUTES.settings} className="iconLink" aria-label={m.common.settings} title={m.common.settings}>
                <SettingsIcon size={20} />
              </Link>
            )}
            <AccountMenu menuItems={host.features.teams ? <CalendarSwitcher /> : undefined} />
          </>
        }
      />
      {user && <LocalImportPrompt userId={user.id} />}
    </div>
  )
}
