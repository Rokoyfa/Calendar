import { useMemo } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import {
  formatDay,
  formatHour,
  formatShortWeekday,
  formatWeekday,
  fromISODate,
  getDayOfMonth,
} from '../../../utils/date.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import { HOURS } from '../constants/grid.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { layoutEvents } from '../utils/layoutEvents.ts'
import { EventBlock } from './EventBlock.tsx'

type DayColumnProps = {
  date: string
  isToday: boolean
  segments: readonly EventSegment[]
  onSlotSelect: (date: string, hour: number) => void
  onEventSelect: (event: EventOccurrence) => void
  onHeaderSelect?: (date: string) => void
}

export function DayColumn({ date, isToday, segments, onSlotSelect, onEventSelect, onHeaderSelect }: DayColumnProps) {
  const day = fromISODate(date)
  const dayLabel = `${formatWeekday(day)}, ${formatDay(day)}`
  const positionedSegments = useMemo(() => layoutEvents(segments), [segments])
  const header = (
    <>
      <span className="dayName">
        <span className="compactHidden">{formatWeekday(day)}</span>
        <span className="compactOnly">{formatShortWeekday(day)}</span>
      </span>
      <span className="dayDisplay">
        <span className="compactHidden">{formatDay(day)}</span>
        <span className="compactOnly">{getDayOfMonth(date)}</span>
      </span>
    </>
  )

  return (
    <div className={classNames('day', isToday && 'currentDay')} data-date={date}>
      {onHeaderSelect ? (
        <button type="button" className="columnHeader" title={`${dayLabel} öffnen`} onClick={() => onHeaderSelect(date)}>
          {header}
        </button>
      ) : (
        <div className="columnHeader">{header}</div>
      )}
      <div className="slots">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="slot"
            data-hour={hour}
            title={`${dayLabel} ${formatHour(hour)}`}
            onClick={() => onSlotSelect(date, hour)}
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
