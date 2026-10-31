import type { CSSProperties } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { formatEventPeriod, getEventColorAttributes, type EventOccurrence } from '../../../utils/event.ts'
import { formatRecurrence } from '../../../utils/recurrence.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { getVisibleDuration } from '../utils/eventGeometry.ts'
import { RepeatIcon } from './Icons.tsx'

type EventBlockProps = {
  segment: EventSegment
  column: number
  columns: number
  onSelect: (event: EventOccurrence) => void
}

const getSizeClass = (duration: number) => (duration <= 30 ? 'veryShortEvent' : duration < 60 ? 'shortEvent' : null)

export function EventBlock({ segment, column, columns, onSelect }: EventBlockProps) {
  const { event, start, continuesBefore, continuesAfter } = segment
  const duration = getVisibleDuration(segment)
  const period = formatEventPeriod(event)
  const recurrenceText = event.recurrence ? formatRecurrence(event.recurrence, event.startDate) : null
  const color = getEventColorAttributes(event.color)
  const style = {
    '--event-start': start,
    '--event-duration': duration,
    '--event-column': column,
    '--event-columns': columns,
    ...color.style,
  } as CSSProperties

  return (
    <button
      type="button"
      className={classNames(
        'event',
        color.className,
        getSizeClass(duration),
        continuesBefore && 'eventContinuesBefore',
        continuesAfter && 'eventContinuesAfter',
      )}
      style={style}
      title={[`${period}: ${event.title}`, recurrenceText].filter(Boolean).join('\n')}
      onClick={() => onSelect(event)}
    >
      <span className="eventName">
        {recurrenceText && <RepeatIcon size={11} />}
        {event.title}
      </span>
      {duration >= 90 && <span className="eventTime">{period}</span>}
    </button>
  )
}
