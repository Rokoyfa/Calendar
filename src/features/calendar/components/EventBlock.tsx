import type { CSSProperties } from 'react'
import { getReadableTextColor, isHexColor } from '../../../utils/color.ts'
import { formatEventPeriod, type CalendarEvent } from '../../../utils/event.ts'
import { MIN_VISIBLE_DURATION } from '../constants/grid.ts'
import type { EventSegment } from '../types/eventLayout.ts'

type EventBlockProps = {
  segment: EventSegment
  column: number
  columns: number
  onSelect: (event: CalendarEvent) => void
}

export function EventBlock({ segment, column, columns, onSelect }: EventBlockProps) {
  const { event, start, end, continuesBefore, continuesAfter } = segment
  const duration = Math.max(end - start, MIN_VISIBLE_DURATION)
  const sizeClass = duration <= 30 ? 'veryShortEvent' : duration < 60 ? 'shortEvent' : null
  const isCustomColor = isHexColor(event.color)
  const period = formatEventPeriod(event)
  const style = {
    '--event-start': start,
    '--event-duration': duration,
    '--event-column': column,
    '--event-columns': columns,
    ...(isHexColor(event.color)
      ? { '--event-color': event.color, '--event-text': getReadableTextColor(event.color) }
      : {}),
  } as CSSProperties

  return (
    <button
      type="button"
      className={[
        'event',
        isCustomColor ? null : `color-${event.color}`,
        sizeClass,
        continuesBefore ? 'eventContinuesBefore' : null,
        continuesAfter ? 'eventContinuesAfter' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      title={`${period}: ${event.title}`}
      onClick={() => onSelect(event)}
    >
      <span className="eventName">{event.title}</span>
      {duration >= 90 && <span className="eventTime">{period}</span>}
    </button>
  )
}
