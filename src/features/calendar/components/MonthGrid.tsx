import type { ReactNode } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { useI18n } from '../../../i18n/index.ts'
import { getMonthWeeks, isSameMonthISO } from '../../../utils/date.ts'

type MonthGridProps = {
  month: string
  className?: string
  renderDay: (date: string, isInMonth: boolean) => ReactNode
}

export function MonthGrid({ month, className, renderDay }: MonthGridProps) {
  const { format } = useI18n()
  return (
    <div className={classNames('monthGrid', className)}>
      {format.shortWeekdays.map(({ weekday, label }) => (
        <div key={weekday} className="monthGridWeekday" aria-hidden="true">
          {label}
        </div>
      ))}
      {getMonthWeeks(month, format.firstDay)
        .flat()
        .map((date) => renderDay(date, isSameMonthISO(date, month)))}
    </div>
  )
}
