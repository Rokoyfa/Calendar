import type { CSSProperties } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { formatEventPeriod, getEventColorAttributes, type EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { getVisibleDuration } from '../utils/eventGeometry.ts'
import { getEventTooltip } from '../utils/eventLabels.ts'
import { EventTitle } from './EventTitle.tsx'

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
      title={getEventTooltip(event)}
      onClick={() => onSelect(event)}
    >
      <EventTitle event={event} />
      {duration >= 90 && <span className="eventTime">{formatEventPeriod(event)}</span>}
    </button>
  )
}
