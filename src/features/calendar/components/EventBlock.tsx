import type { CSSProperties } from 'react'
import { getReadableTextColor, isHexColor } from '../../../utils/color.ts'
import { timeToMinutes } from '../../../utils/date.ts'
import { getEventDuration, type CalendarEvent } from '../../../utils/event.ts'
import { MIN_VISIBLE_DURATION } from '../constants/grid.ts'

type EventBlockProps = {
  event: CalendarEvent
  column: number
  columns: number
  onSelect: (event: CalendarEvent) => void
}

export function EventBlock({ event, column, columns, onSelect }: EventBlockProps) {
  const duration = Math.max(getEventDuration(event), MIN_VISIBLE_DURATION)
  const sizeClass = duration <= 30 ? 'veryShortEvent' : duration < 60 ? 'shortEvent' : null
  const isCustomColor = isHexColor(event.color)
  const style = {
    '--event-start': timeToMinutes(event.start),
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
      className={['event', isCustomColor ? null : `color-${event.color}`, sizeClass].filter(Boolean).join(' ')}
      style={style}
      title={`${event.start} – ${event.end}: ${event.title}`}
      onClick={() => onSelect(event)}
    >
      <span className="eventName">{event.title}</span>
      {duration >= 90 && (
        <span className="eventTime">
          {event.start} – {event.end}
        </span>
      )}
    </button>
  )
}
