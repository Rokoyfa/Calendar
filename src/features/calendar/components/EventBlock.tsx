import type { CSSProperties } from 'react'
import { formatEventPeriod, type EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { useSegmentAttributes } from '../hooks/useSegmentAttributes.ts'
import { getVisibleDuration } from '../utils/eventGeometry.ts'
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
  const { i18n, source, isDragging, style, attributes } = useSegmentAttributes(segment, 'event', getSizeClass(duration))
  const blockStyle = {
    '--event-start': start,
    '--event-duration': duration,
    '--event-column': column,
    '--event-columns': columns,
    ...style,
  } as CSSProperties

  return (
    <button type="button" {...attributes} style={blockStyle} onClick={() => onSelect(event)}>
      <EventTitle event={event} source={source} />
      {source && duration >= 120 && <span className="eventSource">{source.name}</span>}
      {(duration >= 90 || isDragging) && <span className="eventTime">{formatEventPeriod(event, i18n)}</span>}
      {!segment.continuesAfter && <span className="eventResizeHandle" aria-hidden="true" />}
    </button>
  )
}
