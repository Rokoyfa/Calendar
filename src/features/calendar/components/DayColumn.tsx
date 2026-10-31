import { useMemo } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { formatDay, formatHour, formatWeekday, toISODate } from '../../../utils/date.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import { HOURS } from '../constants/grid.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { layoutEvents } from '../utils/layoutEvents.ts'
import { EventBlock } from './EventBlock.tsx'

type DayColumnProps = {
  date: Date
  isToday: boolean
  segments: readonly EventSegment[]
  onSlotSelect: (date: string, hour: number) => void
  onEventSelect: (event: EventOccurrence) => void
}

export function DayColumn({ date, isToday, segments, onSlotSelect, onEventSelect }: DayColumnProps) {
  const isoDate = toISODate(date)
  const dayLabel = `${formatWeekday(date)}, ${formatDay(date)}`
  const positionedSegments = useMemo(() => layoutEvents(segments), [segments])

  return (
    <div className={classNames('day', isToday && 'currentDay')} data-date={isoDate}>
      <div className="columnHeader">
        <div>{formatWeekday(date)}</div>
        <div className="dayDisplay">{formatDay(date)}</div>
      </div>
      <div className="slots">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="slot"
            data-hour={hour}
            title={`${dayLabel} ${formatHour(hour)}`}
            onClick={() => onSlotSelect(isoDate, hour)}
          />
        ))}
        {positionedSegments.map(({ segment, column, columns }) => (
          <EventBlock
            key={segment.event.occurrenceKey}
            segment={segment}
            column={column}
            columns={columns}
            onSelect={onEventSelect}
          />
        ))}
      </div>
    </div>
  )
}
