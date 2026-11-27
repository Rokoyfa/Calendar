import { useMemo, type CSSProperties } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { useI18n } from '../../../i18n/index.ts'
import { fromISODate, getDayOfMonth } from '../../../utils/date.ts'
import type { EventOccurrence } from '../../../domain/event.ts'
import { HOURS } from '../constants/grid.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { AllDaySegment } from '../utils/allDay.ts'
import { layoutEvents } from '../utils/layoutEvents.ts'
import { EventBlock } from './EventBlock.tsx'
import { EventChip } from './EventChip.tsx'
import { NowIndicator } from './NowIndicator.tsx'
import { useHolidayNames } from '../context/HolidaysContext.ts'
import { getDayLabel } from '../utils/eventLabels.ts'
import { SLOT_NAVIGATION_KEYS } from '../hooks/useSlotNavigation.ts'
import { DayTasks } from '../../tasks/index.ts'

type DayColumnProps = {
  date: string
  isToday: boolean
  nowMinutes: number | null
  segments: readonly EventSegment[]
  allDaySegments: readonly AllDaySegment[]
  allDayRowOffset?: number
  taskRows?: { offset: number; limit: number }
  selection?: { fromHour: number; toHour: number; label: string | null } | null
  onSlotSelect: (date: string, hour: number) => void
  onAllDaySelect: (date: string) => void
  onEventSelect: (event: EventOccurrence) => void
  onHeaderSelect?: (date: string) => void
  focusHour?: number | null
}

export function DayColumn({
  date,
  isToday,
  nowMinutes,
  segments,
  allDaySegments,
  allDayRowOffset = 0,
  taskRows,
  selection = null,
  onSlotSelect,
  onAllDaySelect,
  onEventSelect,
  onHeaderSelect,
  focusHour,
}: DayColumnProps) {
  const i18n = useI18n()
  const { m, format } = i18n
  const day = fromISODate(date)
  const dayLabel = format.longDate(date)
  const positionedSegments = useMemo(() => layoutEvents(segments), [segments])
  const holidayNames = useHolidayNames(date)
  const holidayText = holidayNames.join(' · ')
  const header = (
    <>
      <span className="dayName">
        <span className="compactHidden">{format.weekday(day)}</span>
        <span className="compactOnly">{format.shortWeekday(day)}</span>
      </span>
      <span className="dayDisplay">
        <span className="compactHidden">{format.day(day)}</span>
        <span className="compactOnly">{getDayOfMonth(date)}</span>
      </span>
    </>
  )

  return (
    <div
      className={classNames('day', isToday && 'currentDay', holidayText && 'holiday')}
      data-date={date}
      role="group"
      aria-label={getDayLabel(date, isToday, holidayNames, i18n)}
    >
      {onHeaderSelect ? (
        <button
          type="button"
          className="columnHeader"
          title={m.calendar.openDay(dayLabel)}
          onClick={() => onHeaderSelect(date)}
        >
          {header}
        </button>
      ) : (
        <div className="columnHeader">{header}</div>
      )}
      <div className="allDayLane" title={`${dayLabel} ${m.events.allDay}`} onClick={() => onAllDaySelect(date)}>
        {holidayText && (
          <span className="holidayLabel" title={m.calendar.holiday(holidayText)}>
            {holidayText}
          </span>
        )}
        {taskRows && taskRows.limit > 0 && (
          <DayTasks
            date={date}
            limit={taskRows.limit}
            rowOffset={taskRows.offset}
            onMore={onHeaderSelect && (() => onHeaderSelect(date))}
          />
        )}
        {allDaySegments.map(({ segment, row, isFirst }) => (
          <EventChip
            key={segment.event.occurrenceKey}
            segment={segment}
            row={row + allDayRowOffset}
            isContinuation={!isFirst}
            onSelect={onEventSelect}
          />
        ))}
      </div>
      <div className="slots">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="slot"
            data-hour={hour}
            title={`${dayLabel} ${format.hour(hour)}`}
            role={focusHour === undefined ? undefined : 'button'}
            tabIndex={focusHour === undefined ? undefined : hour === focusHour ? 0 : -1}
            aria-label={focusHour === undefined ? undefined : m.calendar.newEventAt(dayLabel, format.hour(hour))}
            aria-keyshortcuts={focusHour === undefined ? undefined : SLOT_NAVIGATION_KEYS}
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
        {selection && (
          <div
            className="slotSelection"
            style={
              {
                '--selection-start': selection.fromHour,
                '--selection-hours': selection.toHour - selection.fromHour + 1,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            {selection.label && <span className="slotSelectionLabel">{selection.label}</span>}
          </div>
        )}
        {nowMinutes !== null && <NowIndicator minutes={nowMinutes} isToday={isToday} />}
      </div>
    </div>
  )
}
