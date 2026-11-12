import { useMemo, useRef, type CSSProperties } from 'react'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { createEventInputForSlots, formatEventPeriod } from '../../../utils/event.ts'
import { useSlotSelection } from '../hooks/useSlotSelection.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { CalendarViewProps } from '../types/view.ts'
import { splitAllDay, type AllDaySegment } from '../utils/allDay.ts'
import { getHoursOnDate, toSlotRange } from '../utils/slotSelection.ts'
import { DayColumn } from './DayColumn.tsx'
import { useHolidayMap } from '../context/HolidaysContext.ts'
import { TimeColumn } from './TimeColumn.tsx'

const NO_SEGMENTS: readonly EventSegment[] = []
const NO_ALL_DAY: readonly AllDaySegment[] = []

export function TimeGridView({
  dates,
  today,
  currentMinutes,
  segmentsByDate,
  canCreate,
  onCreate,
  onCreateRange,
  onCreateAllDay,
  onEventSelect,
  onShowDay,
}: CalendarViewProps) {
  const i18n = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const selection = useSlotSelection(containerRef, canCreate, onCreateRange)
  const range = useMemo(() => (selection ? toSlotRange(selection) : null), [selection])
  const rangeLabel = range ? formatEventPeriod(createEventInputForSlots(range.first, range.last, null), i18n) : null
  const isSingleDay = dates.length === 1
  const lanes = useMemo(() => splitAllDay(dates, segmentsByDate), [dates, segmentsByDate])
  const showsToday = dates.includes(today)
  const holidays = useHolidayMap()
  const holidayRows = dates.some((date) => holidays.has(date)) ? 1 : 0
  const hasAllDayEvents = [...lanes.allDay.values()].some((segments) => segments.length > 0)
  const allDayRows = holidayRows + (hasAllDayEvents || holidayRows === 0 ? lanes.rows : 0)

  return (
    <div
      ref={containerRef}
      className={classNames('calendar', isSingleDay ? 'calendar--day' : 'calendar--week', range && 'isSelecting')}
      style={{ '--all-day-rows': allDayRows } as CSSProperties}
    >
      <TimeColumn />
      {dates.map((date) => {
        const hours = range && getHoursOnDate(range, date)
        return (
          <DayColumn
            key={date}
            date={date}
            isToday={date === today}
            nowMinutes={showsToday ? currentMinutes : null}
            segments={lanes.timed.get(date) ?? NO_SEGMENTS}
            allDaySegments={lanes.allDay.get(date) ?? NO_ALL_DAY}
            allDayRowOffset={holidayRows}
            selection={hours && { ...hours, label: date === range.first.date ? rangeLabel : null }}
            onSlotSelect={onCreate}
            onAllDaySelect={(allDayDate) => {
              if (canCreate) onCreateAllDay(allDayDate)
            }}
            onEventSelect={onEventSelect}
            onHeaderSelect={isSingleDay ? undefined : onShowDay}
          />
        )
      })}
    </div>
  )
}
