import { getEventColorAttributes } from '../../../utils/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import { isPersonalCalendar } from '../utils/permissions.ts'

export function ActiveCalendarIndicator() {
  const { m } = useI18n()
  const { activeCalendar } = useCalendars()
  const { indicator, roles } = m.calendars
  const meta = isPersonalCalendar(activeCalendar) ? indicator.onlyYou : indicator.team(roles[activeCalendar.role])

  return (
    <p
      {...getEventColorAttributes(activeCalendar.color, 'activeCalendar')}
      aria-label={indicator.current(activeCalendar.name)}
    >
      <span className="activeCalendarDot" aria-hidden="true" />
      <span className="activeCalendarName">{activeCalendar.name}</span>
      <span className="activeCalendarMeta">{meta}</span>
    </p>
  )
}
