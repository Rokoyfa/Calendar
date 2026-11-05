import { classNames } from '../../../utils/classNames.ts'
import { formatLongDate, getDayOfMonth } from '../../../utils/date.ts'
import { MonthGrid } from './MonthGrid.tsx'

type MiniMonthProps = {
  month: string
  today: string
  className?: string
  hasEvents?: (date: string) => boolean
  onSelectDay?: (date: string) => void
}

export function MiniMonth({ month, today, className, hasEvents, onSelectDay }: MiniMonthProps) {
  return (
    <MonthGrid
      month={month}
      className={classNames('miniMonth', className)}
      renderDay={(date, isInMonth) => {
        if (!isInMonth) return <span key={date} className="miniDay outsideMonth" aria-hidden="true" />
        const dayClassName = classNames('miniDay', date === today && 'today', hasEvents?.(date) && 'hasEvents')
        return onSelectDay ? (
          <button
            key={date}
            type="button"
            className={dayClassName}
            title={formatLongDate(date)}
            onClick={() => onSelectDay(date)}
          >
            {getDayOfMonth(date)}
          </button>
        ) : (
          <span key={date} className={dayClassName}>
            {getDayOfMonth(date)}
          </span>
        )
      }}
    />
  )
}
