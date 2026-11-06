import { useI18n } from '../../../i18n/index.ts'
import { toISODate } from '../../../utils/date.ts'
import { getEventColorAttributes, type EventColor } from '../../../utils/event.ts'
import { MiniMonth } from '../../calendar/index.ts'

export function CalendarPreview({ color }: { color: EventColor }) {
  const { format } = useI18n()
  const today = toISODate(new Date())

  return (
    <div {...getEventColorAttributes(color, 'calendarPreview')} aria-hidden="true">
      <div className="calendarPreviewHeader">{format.monthYear(today)}</div>
      <MiniMonth month={today} today={today} className="calendarPreviewMonth" />
    </div>
  )
}
