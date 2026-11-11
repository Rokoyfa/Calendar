import { useMemo } from 'react'
import { Link } from 'react-router'
import { SettingsIcon } from '../components/Icons.tsx'
import { ROUTES } from '../config/routes.ts'
import { AccountMenu, EmailVerificationBanner, useAuth } from '../features/authorization/index.ts'
import { Calendar } from '../features/calendar/index.ts'
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
import { getStartView, isCompactWidth } from '../utils/preferences.ts'

export function CalendarPage() {
  const root = useRootElement()
  const host = useHost()
  const { enabled, method, user } = useAuth()
  const hasAccountMenu = enabled && (user !== null || method === 'password')
  const { preferences } = usePreferences()
  const { m } = useI18n()
  const { calendars, activeCalendar, visibleCalendarIds, repository } = useCalendars()
  const loadAttendeeCandidates = useMemo(() => {
    if (!host.teams || !user) return undefined
    return async (calendarId: string) => {
      const calendar = calendars.find((entry) => entry.id === calendarId)
      if (!calendar || isPersonalCalendar(calendar)) return []
      const members = await repository.listMembers(calendar.teamId)
      return members.map(({ email, name }) => ({ email, name }))
    }
  }, [host.teams, user, calendars, repository])
  const eventSources = useMemo(
    () => new Map(getSharedCalendars(calendars, activeCalendar).map(({ id, name, color }) => [id, { name, color }])),
    [calendars, activeCalendar],
  )
  const initialView = host.initialView ?? getStartView(preferences, isCompactWidth(root.clientWidth))

  return (
    <div className="app">
      <EmailVerificationBanner />
      <Calendar
        calendarIds={visibleCalendarIds}
        targetCalendarId={activeCalendar.id}
        canCreate={hasPermission(activeCalendar, 'create_entry')}
        eventSources={eventSources}
        initialView={initialView}
        headerContext={<ActiveCalendarIndicator />}
        currentUserEmail={user?.email ?? null}
        loadAttendeeCandidates={loadAttendeeCandidates}
        headerAccessory={
          <>
            {!hasAccountMenu && (
              <Link to={ROUTES.settings} className="iconLink" aria-label={m.common.settings} title={m.common.settings}>
                <SettingsIcon size={20} />
              </Link>
            )}
            <AccountMenu menuItems={host.teams ? <CalendarSwitcher /> : undefined} />
          </>
        }
      />
      {user && <LocalImportPrompt userId={user.id} />}
    </div>
  )
}
