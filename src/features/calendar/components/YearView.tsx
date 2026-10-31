import { classNames } from '../../../utils/classNames.ts'
import { formatLongDate, formatMonthName, getDayOfMonth } from '../../../utils/date.ts'
import type { CalendarViewProps } from '../types/view.ts'
import { MonthGrid } from './MonthGrid.tsx'

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))

export function YearView({ anchor, today, segmentsByDate, onShowDay, onShowMonth }: CalendarViewProps) {
  const year = anchor.slice(0, 4)
  return (
    <div className="yearView">
      {MONTHS.map((month) => {
        const firstDay = `${year}-${month}-01`
        return (
          <section key={month} className="yearMonth">
            <h2>
              <button type="button" className="yearMonthTitle" onClick={() => onShowMonth(firstDay)}>
                {formatMonthName(firstDay)}
              </button>
            </h2>
            <MonthGrid
              month={firstDay}
              className="miniMonth"
              renderDay={(date, isInMonth) =>
                isInMonth ? (
                  <button
                    key={date}
                    type="button"
                    className={classNames(
                      'miniDay',
                      date === today && 'today',
                      segmentsByDate.has(date) && 'hasEvents',
                    )}
                    title={formatLongDate(date)}
                    onClick={() => onShowDay(date)}
                  >
                    {getDayOfMonth(date)}
                  </button>
                ) : (
                  <span key={date} className="miniDay outsideMonth" aria-hidden="true" />
                )
              }
            />
          </section>
        )
      })}
    </div>
  )
}
