import type { CSSProperties } from 'react'
import { formatEventPeriod, type EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { getVisibleDuration } from '../utils/eventGeometry.ts'
import { getSegmentAttributes } from '../utils/eventLabels.ts'
import { EventTitle } from './EventTitle.tsx'

type EventBlockProps = {
  segment: EventSegment
  column: number
  columns: number
  onSelect: (event: EventOccurrence) => void
}

const getSizeClass = (duration: number) => (duration <= 30 ? 'veryShortEvent' : duration < 60 ? 'shortEvent' : null)

export function EventBlock({ segment, column, columns, onSelect }: EventBlockProps) {
  const { event, start } = segment
  const duration = getVisibleDuration(segment)
  const { style: colorStyle, ...attributes } = getSegmentAttributes(segment, 'event', getSizeClass(duration))
  const style = {
    '--event-start': start,
    '--event-duration': duration,
    '--event-column': column,
    '--event-columns': columns,
    ...colorStyle,
  } as CSSProperties

  return (
    <button type="button" {...attributes} style={style} onClick={() => onSelect(event)}>
      <EventTitle event={event} />
      {duration >= 90 && <span className="eventTime">{formatEventPeriod(event)}</span>}
    </button>
  )
}
