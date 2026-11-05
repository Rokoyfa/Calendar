import { getEventColorAttributes } from '../../../utils/event.ts'
import { ROLE_LABELS } from '../constants/calendars.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import { isPersonalCalendar } from '../utils/permissions.ts'

export function ActiveCalendarIndicator() {
  const { activeCalendar } = useCalendars()
  const meta = isPersonalCalendar(activeCalendar) ? 'Nur für dich' : `Team · ${ROLE_LABELS[activeCalendar.role]}`

  return (
    <p
      {...getEventColorAttributes(activeCalendar.color, 'activeCalendar')}
      aria-label={`Aktueller Kalender: ${activeCalendar.name}`}
    >
      <span className="activeCalendarDot" aria-hidden="true" />
      <span className="activeCalendarName">{activeCalendar.name}</span>
      <span className="activeCalendarMeta">{meta}</span>
    </p>
  )
}
