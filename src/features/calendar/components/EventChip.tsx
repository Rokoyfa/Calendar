import { minutesToTime } from '../../../utils/date.ts'
import { withoutPropagation } from '../../../utils/dom.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { getSegmentAttributes } from '../utils/eventLabels.ts'
import { EventTitle } from './EventTitle.tsx'

type EventChipProps = {
  segment: EventSegment
  onSelect: (event: EventOccurrence) => void
}

export function EventChip({ segment, onSelect }: EventChipProps) {
  const { event, start, continuesBefore } = segment

  return (
    <button
      type="button"
      {...getSegmentAttributes(segment, 'eventChip')}
      onClick={withoutPropagation(() => onSelect(event))}
    >
      {!continuesBefore && <span className="eventChipTime">{minutesToTime(start)}</span>}
      <EventTitle event={event} />
    </button>
  )
}
