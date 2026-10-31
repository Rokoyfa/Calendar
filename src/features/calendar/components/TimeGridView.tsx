import { classNames } from '../../../utils/classNames.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { CalendarViewProps } from '../types/view.ts'
import { DayColumn } from './DayColumn.tsx'
import { TimeColumn } from './TimeColumn.tsx'

const NO_SEGMENTS: readonly EventSegment[] = []

export function TimeGridView({
  dates,
  today,
  currentMinutes,
  segmentsByDate,
  onCreate,
  onEventSelect,
  onShowDay,
}: CalendarViewProps) {
  const isSingleDay = dates.length === 1
  const showsToday = dates.includes(today)

  return (
    <div className={classNames('calendar', isSingleDay ? 'calendar--day' : 'calendar--week')}>
      <TimeColumn />
      {dates.map((date) => (
        <DayColumn
          key={date}
          date={date}
          isToday={date === today}
          nowMinutes={showsToday ? currentMinutes : null}
          segments={segmentsByDate.get(date) ?? NO_SEGMENTS}
          onSlotSelect={onCreate}
          onEventSelect={onEventSelect}
          onHeaderSelect={isSingleDay ? undefined : onShowDay}
        />
      ))}
    </div>
  )
}
