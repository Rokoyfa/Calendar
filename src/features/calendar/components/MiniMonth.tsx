import { classNames } from '../../../utils/classNames.ts'
import { useI18n } from '../../../i18n/index.ts'
import { getDayOfMonth } from '../../../utils/date.ts'
import { MonthGrid } from './MonthGrid.tsx'

type MiniMonthProps = {
  month: string
  today: string
  className?: string
  hasEvents?: (date: string) => boolean
  getHoliday?: (date: string) => string | undefined
  onSelectDay?: (date: string) => void
  isSelected?: (date: string) => boolean
}

export function MiniMonth({ month, today, className, hasEvents, getHoliday, onSelectDay, isSelected }: MiniMonthProps) {
  const { format } = useI18n()
  return (
    <MonthGrid
      month={month}
      className={classNames('miniMonth', className)}
      renderDay={(date, isInMonth) => {
        if (!isInMonth) return <span key={date} className="miniDay outsideMonth" aria-hidden="true" />
        const holiday = getHoliday?.(date)
        const dayClassName = classNames(
          'miniDay',
          date === today && 'today',
          hasEvents?.(date) && 'hasEvents',
          holiday && 'holiday',
          isSelected?.(date) && 'selected',
        )
        return onSelectDay ? (
          <button
            key={date}
            type="button"
            className={dayClassName}
            title={holiday ? `${format.longDate(date)}\n${holiday}` : format.longDate(date)}
            aria-current={isSelected?.(date) || undefined}
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
