import { classNames } from '../../../utils/classNames.ts'
import { minutesToTime } from '../../../utils/date.ts'
import { getEventColorAttributes, type EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { getEventTooltip } from '../utils/eventLabels.ts'
import { EventTitle } from './EventTitle.tsx'

type EventChipProps = {
  segment: EventSegment
  onSelect: (event: EventOccurrence) => void
}

export function EventChip({ segment, onSelect }: EventChipProps) {
  const { event, start, continuesBefore, continuesAfter } = segment
  const color = getEventColorAttributes(event.color)

  return (
    <button
      type="button"
      className={classNames(
        'eventChip',
        color.className,
        continuesBefore && 'eventContinuesBefore',
        continuesAfter && 'eventContinuesAfter',
      )}
      style={color.style}
      title={getEventTooltip(event)}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation()
        onSelect(event)
      }}
    >
      {!continuesBefore && <span className="eventChipTime">{minutesToTime(start)}</span>}
      <EventTitle event={event} />
    </button>
  )
}
