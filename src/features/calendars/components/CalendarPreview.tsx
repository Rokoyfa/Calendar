import { classNames } from '../../../utils/classNames.ts'
import { formatMonthYear, getDayOfMonth, toISODate } from '../../../utils/date.ts'
import { getEventColorAttributes, type EventColor } from '../../../utils/event.ts'
import { MonthGrid } from '../../calendar/index.ts'

export function CalendarPreview({ color }: { color: EventColor }) {
  const today = toISODate(new Date())
  const { className, style } = getEventColorAttributes(color)

  return (
    <div className={classNames('calendarPreview', className)} style={style} aria-hidden="true">
      <div className="calendarPreviewHeader">{formatMonthYear(today)}</div>
      <MonthGrid
        month={today}
        className="calendarPreviewMonth"
        renderDay={(date, isInMonth) => (
          <span
            key={date}
            className={classNames('calendarPreviewDay', !isInMonth && 'outsideMonth', date === today && 'today')}
          >
            {isInMonth ? getDayOfMonth(date) : ''}
          </span>
        )}
      />
    </div>
  )
}
