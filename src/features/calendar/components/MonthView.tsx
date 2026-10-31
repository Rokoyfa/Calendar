import { classNames } from '../../../utils/classNames.ts'
import { formatLongDate, getDayOfMonth } from '../../../utils/date.ts'
import { DEFAULT_EVENT_HOUR, MAX_EVENTS_PER_MONTH_CELL } from '../constants/grid.ts'
import type { CalendarViewProps } from '../types/view.ts'
import { sortSegments } from '../utils/layoutEvents.ts'
import { EventChip } from './EventChip.tsx'
import { MonthGrid } from './MonthGrid.tsx'

export function MonthView({ anchor, today, segmentsByDate, onCreate, onEventSelect, onShowDay }: CalendarViewProps) {
  return (
    <MonthGrid
      month={anchor}
      className="monthView"
      renderDay={(date, isInMonth) => {
        const segments = sortSegments(segmentsByDate.get(date) ?? [])
        const visibleCount =
          segments.length > MAX_EVENTS_PER_MONTH_CELL ? MAX_EVENTS_PER_MONTH_CELL - 1 : segments.length
        const moreCount = segments.length - visibleCount
        return (
          <div
            key={date}
            className={classNames('monthCell', !isInMonth && 'outsideMonth', date === today && 'today')}
            data-date={date}
            onClick={() => onCreate(date, DEFAULT_EVENT_HOUR)}
          >
            <button
              type="button"
              className="dayNumber"
              title={`${formatLongDate(date)} öffnen`}
              onClick={(event) => {
                event.stopPropagation()
                onShowDay(date)
              }}
            >
              {getDayOfMonth(date)}
            </button>
            <div className="monthCellEvents">
              {segments.slice(0, visibleCount).map((segment) => (
                <EventChip key={segment.event.occurrenceKey} segment={segment} onSelect={onEventSelect} />
              ))}
              {moreCount > 0 && (
                <button
                  type="button"
                  className="moreEvents"
                  onClick={(event) => {
                    event.stopPropagation()
                    onShowDay(date)
                  }}
                >
                  +{moreCount} weitere
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
