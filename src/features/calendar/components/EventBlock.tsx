import type { CSSProperties } from 'react'
import { useI18n } from '../../../i18n/index.ts'
import { formatEventPeriod, type EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { useEventSource } from '../hooks/useEventSource.ts'
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
  const i18n = useI18n()
  const source = useEventSource(event)
  const duration = getVisibleDuration(segment)
  const { style: colorStyle, ...attributes } = getSegmentAttributes(segment, source, i18n, 'event', getSizeClass(duration))
  const style = {
    '--event-start': start,
    '--event-duration': duration,
    '--event-column': column,
    '--event-columns': columns,
    ...colorStyle,
  } as CSSProperties

  return (
    <button type="button" {...attributes} style={style} onClick={() => onSelect(event)}>
      <EventTitle event={event} source={source} />
      {source && duration >= 120 && <span className="eventSource">{source.name}</span>}
      {duration >= 90 && <span className="eventTime">{formatEventPeriod(event, i18n)}</span>}
    </button>
  )
}
