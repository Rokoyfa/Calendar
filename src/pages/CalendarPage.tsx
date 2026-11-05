import { Link } from 'react-router'
import { SettingsIcon } from '../components/Icons.tsx'
import { ROUTES } from '../config/routes.ts'
import { AccountMenu, EmailVerificationBanner, useAuth } from '../features/authorization/index.ts'
import { Calendar } from '../features/calendar/index.ts'
import { ActiveCalendarIndicator, CalendarSwitcher, useCalendars } from '../features/calendars/index.ts'
import { usePreferences } from '../features/preferences/index.ts'
import { LocalImportPrompt } from '../features/storage/index.ts'
import { getStartView, MOBILE_MEDIA_QUERY } from '../utils/preferences.ts'

export function CalendarPage() {
  const { enabled, user } = useAuth()
  const { preferences } = usePreferences()
  const { activeCalendar, visibleCalendarIds } = useCalendars()
  const initialView = getStartView(preferences, window.matchMedia(MOBILE_MEDIA_QUERY).matches)

  return (
    <div className="app">
      <EmailVerificationBanner />
      <Calendar
        calendarIds={visibleCalendarIds}
        targetCalendarId={activeCalendar.id}
        initialView={initialView}
        headerContext={<ActiveCalendarIndicator />}
        headerAccessory={
          <>
            {!enabled && (
              <Link to={ROUTES.settings} className="iconLink" aria-label="Einstellungen" title="Einstellungen">
                <SettingsIcon size={20} />
              </Link>
            )}
            <AccountMenu menuItems={<CalendarSwitcher />} />
          </>
        }
      />
      {user && <LocalImportPrompt userId={user.id} />}
    </div>
  )
}
