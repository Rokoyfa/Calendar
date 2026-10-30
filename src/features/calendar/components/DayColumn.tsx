import { useMemo } from 'react'
import { formatDay, formatHour, formatWeekday, toISODate } from '../../../utils/date.ts'
import type { CalendarEvent } from '../../../utils/event.ts'
import { HOURS, MIN_VISIBLE_DURATION } from '../constants/grid.ts'
import { layoutEvents } from '../utils/layoutEvents.ts'
import { EventBlock } from './EventBlock.tsx'

type DayColumnProps = {
  date: Date
  isToday: boolean
  events: readonly CalendarEvent[]
  onSlotSelect: (date: string, hour: number) => void
  onEventSelect: (event: CalendarEvent) => void
}

export function DayColumn({ date, isToday, events, onSlotSelect, onEventSelect }: DayColumnProps) {
  const isoDate = toISODate(date)
  const positionedEvents = useMemo(() => layoutEvents(events, MIN_VISIBLE_DURATION), [events])

  return (
    <div className={isToday ? 'day currentDay' : 'day'} data-date={isoDate}>
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
            title={`${formatWeekday(date)}, ${formatDay(date)} ${formatHour(hour)}`}
            onClick={() => onSlotSelect(isoDate, hour)}
          />
        ))}
        {positionedEvents.map(({ event, column, columns }) => (
          <EventBlock key={event.id} event={event} column={column} columns={columns} onSelect={onEventSelect} />
        ))}
      </div>
    </div>
  )
}
