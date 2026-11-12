import type { CSSProperties } from 'react'
import { formatEventPeriod, type EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { useSegmentAttributes } from '../hooks/useSegmentAttributes.ts'
import { getVisibleDuration } from '../utils/eventGeometry.ts'
import { EventLinks } from './EventLinks.tsx'
import { EventLocation } from './EventLocation.tsx'
import { EventTitle } from './EventTitle.tsx'
import { UnreadBadge } from '../../chat/index.ts'
import { getChatKey } from '../../../utils/chat.ts'

type EventBlockProps = {
  segment: EventSegment
  column: number
  columns: number
  onSelect: (event: EventOccurrence) => void
}

const DETAILS_MIN_DURATION = 90
const SOURCE_MIN_DURATION = 120
const LINES_BASE_DURATION = 120
const LINE_DURATION = 30

const getSizeClass = (duration: number) => (duration <= 30 ? 'veryShortEvent' : duration < 60 ? 'shortEvent' : null)

const getLinkLines = (duration: number, withSource: boolean) =>
  Math.max(Math.floor((duration - LINES_BASE_DURATION - (withSource ? LINE_DURATION : 0)) / LINE_DURATION), 0)

export function EventBlock({ segment, column, columns, onSelect }: EventBlockProps) {
  const { event, start } = segment
  const duration = getVisibleDuration(segment)
  const { i18n, source, isDragging, style, attributes } = useSegmentAttributes(segment, 'event', getSizeClass(duration))
  const showDetails = duration >= DETAILS_MIN_DURATION
  const showSource = Boolean(source) && duration >= SOURCE_MIN_DURATION
  const blockStyle = {
    '--event-start': start,
    '--event-duration': duration,
    '--event-column': column,
    '--event-columns': columns,
    ...style,
  } as CSSProperties

  return (
    <div {...attributes} style={blockStyle}>
      <UnreadBadge chatKey={getChatKey(event)} />
      <button type="button" className="eventOpen" aria-label={attributes.title} onClick={() => onSelect(event)} />
      <EventTitle event={event} source={source} withLocation={!showDetails} />
      {event.location && showDetails && <EventLocation location={event.location} />}
      {!isDragging && <EventLinks links={event.links} lines={getLinkLines(duration, showSource)} />}
      {source && showSource && <span className="eventSource">{source.name}</span>}
      {(showDetails || isDragging) && <span className="eventTime">{formatEventPeriod(event, i18n)}</span>}
      {!segment.continuesAfter && <span className="eventResizeHandle" aria-hidden="true" />}
    </div>
  )
}
