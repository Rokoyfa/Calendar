import { getEventColorAttributes, type EventColor } from '../../../domain/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import { isPersonalCalendar } from '../utils/permissions.ts'

type SharedCalendar = { name: string; color: EventColor }

export function ActiveCalendarIndicator({ shared }: { shared?: SharedCalendar }) {
  const { m } = useI18n()
  const { activeCalendar } = useCalendars()
  const { indicator, roles } = m.calendars
  const current = shared ?? activeCalendar
  const meta = shared
    ? indicator.shared
    : isPersonalCalendar(activeCalendar)
      ? indicator.onlyYou
      : indicator.team(roles[activeCalendar.role])

  return (
    <p {...getEventColorAttributes(current.color, 'activeCalendar')} aria-label={indicator.current(current.name)}>
      <span className="activeCalendarDot" aria-hidden="true" />
      <span className="activeCalendarName">{current.name}</span>
      <span className="activeCalendarMeta">{meta}</span>
    </p>
  )
}
