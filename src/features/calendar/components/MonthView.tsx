import { classNames } from '../../../utils/classNames.ts'
import { withoutPropagation } from '../../../utils/dom.ts'
import { useI18n } from '../../../i18n/index.ts'
import { getDayOfMonth } from '../../../utils/date.ts'
import { DEFAULT_EVENT_HOUR, MAX_EVENTS_PER_MONTH_CELL } from '../constants/grid.ts'
import type { CalendarViewProps } from '../types/view.ts'
import { sortSegments } from '../utils/layoutEvents.ts'
import { EventChip } from './EventChip.tsx'
import { MonthGrid } from './MonthGrid.tsx'
import { useHolidayMap } from '../context/HolidaysContext.ts'

export function MonthView({ anchor, today, segmentsByDate, onCreate, onEventSelect, onShowDay }: CalendarViewProps) {
  const { m, format } = useI18n()
  const holidays = useHolidayMap()
  return (
    <MonthGrid
      month={anchor}
      className="monthView"
      renderDay={(date, isInMonth) => {
        const segments = sortSegments(segmentsByDate.get(date) ?? [])
        const holidayText = holidays.get(date)?.join(' · ')
        const capacity = MAX_EVENTS_PER_MONTH_CELL - (holidayText ? 1 : 0)
        const visibleCount = segments.length > capacity ? capacity - 1 : segments.length
        const moreCount = segments.length - visibleCount
        const showDay = withoutPropagation(() => onShowDay(date))
        return (
          <div
            key={date}
            className={classNames(
              'monthCell',
              !isInMonth && 'outsideMonth',
              date === today && 'today',
              holidayText && 'holiday',
            )}
            data-date={date}
            onClick={() => onCreate(date, DEFAULT_EVENT_HOUR)}
          >
            <button
              type="button"
              className="dayNumber"
              title={m.calendar.openDay(format.longDate(date))}
              onClick={showDay}
            >
              {getDayOfMonth(date)}
            </button>
            {holidayText && (
              <span className="holidayLabel" title={m.calendar.holiday(holidayText)}>
                {holidayText}
              </span>
            )}
            <div className="monthCellEvents">
              {segments.slice(0, visibleCount).map((segment) => (
                <EventChip key={segment.event.occurrenceKey} segment={segment} onSelect={onEventSelect} />
              ))}
              {moreCount > 0 && (
                <button type="button" className="moreEvents" onClick={showDay}>
                  {m.calendar.moreEvents(moreCount)}
                </button>
              )}
            </div>
            {segments.length > 0 && (
              <span className="eventDots" aria-hidden="true">
                {segments.length}
              </span>
            )}
          </div>
        )
      }}
    />
  )
}
