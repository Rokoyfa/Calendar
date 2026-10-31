import type { ReactNode } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { getMonthWeeks, isSameMonthISO, WEEKDAY_SHORT_LABELS } from '../../../utils/date.ts'

type MonthGridProps = {
  month: string
  className?: string
  renderDay: (date: string, isInMonth: boolean) => ReactNode
}

export function MonthGrid({ month, className, renderDay }: MonthGridProps) {
  return (
    <div className={classNames('monthGrid', className)}>
      {WEEKDAY_SHORT_LABELS.map((label) => (
        <div key={label} className="monthGridWeekday" aria-hidden="true">
          {label}
        </div>
      ))}
      {getMonthWeeks(month)
        .flat()
        .map((date) => renderDay(date, isSameMonthISO(date, month)))}
    </div>
  )
}
