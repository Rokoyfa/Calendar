import { useMemo, useRef } from 'react'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { createEventInputForSlots, formatEventPeriod } from '../../../utils/event.ts'
import { useSlotSelection } from '../hooks/useSlotSelection.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { CalendarViewProps } from '../types/view.ts'
import { getHoursOnDate, toSlotRange } from '../utils/slotSelection.ts'
import { DayColumn } from './DayColumn.tsx'
import { TimeColumn } from './TimeColumn.tsx'

const NO_SEGMENTS: readonly EventSegment[] = []

export function TimeGridView({
  dates,
  today,
  currentMinutes,
  segmentsByDate,
  canCreate,
  onCreate,
  onCreateRange,
  onEventSelect,
  onShowDay,
}: CalendarViewProps) {
  const i18n = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const { selection, isClickSuppressed } = useSlotSelection(containerRef, canCreate, onCreateRange)
  const range = useMemo(() => (selection ? toSlotRange(selection) : null), [selection])
  const rangeLabel = range ? formatEventPeriod(createEventInputForSlots(range.first, range.last), i18n) : null
  const isSingleDay = dates.length === 1
  const showsToday = dates.includes(today)

  return (
    <div
      ref={containerRef}
      className={classNames('calendar', isSingleDay ? 'calendar--day' : 'calendar--week', range && 'isSelecting')}
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
            segments={segmentsByDate.get(date) ?? NO_SEGMENTS}
            selection={hours && { ...hours, label: date === range.first.date ? rangeLabel : null }}
            onSlotSelect={(slotDate, hour) => {
              if (!isClickSuppressed()) onCreate(slotDate, hour)
            }}
            onEventSelect={onEventSelect}
            onHeaderSelect={isSingleDay ? undefined : onShowDay}
          />
        )
      })}
    </div>
  )
}
