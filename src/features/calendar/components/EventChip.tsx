import { useI18n } from '../../../i18n/index.ts'
import { withoutPropagation } from '../../../utils/dom.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { useEventSource } from '../hooks/useEventSource.ts'
import { getSegmentAttributes } from '../utils/eventLabels.ts'
import { EventTitle } from './EventTitle.tsx'

type EventChipProps = {
  segment: EventSegment
  row?: number
  isContinuation?: boolean
  onSelect: (event: EventOccurrence) => void
}

export function EventChip({ segment, row, isContinuation = false, onSelect }: EventChipProps) {
  const { event, start, continuesBefore } = segment
  const i18n = useI18n()
  const source = useEventSource(event)

  const { style, ...attributes } = getSegmentAttributes(
    segment,
    source,
    i18n,
    'eventChip',
    isContinuation && 'eventChipContinuation',
  )

  return (
    <button
      type="button"
      {...attributes}
      style={row === undefined ? style : { ...style, gridRow: row + 1 }}
      onClick={withoutPropagation(() => onSelect(event))}
    >
      {!continuesBefore && !event.allDay && <span className="eventChipTime">{i18n.format.time(start)}</span>}
      <EventTitle event={event} source={source} />
    </button>
  )
}
