import { withoutPropagation } from '../../../utils/dom.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { useSegmentAttributes } from '../hooks/useSegmentAttributes.ts'
import { EventTitle } from './EventTitle.tsx'
import { UnreadBadge } from '../../chat/index.ts'
import { getChatKey } from '../../../utils/chat.ts'

type EventChipProps = {
  segment: EventSegment
  row?: number
  isContinuation?: boolean
  onSelect: (event: EventOccurrence) => void
}

export function EventChip({ segment, row, isContinuation = false, onSelect }: EventChipProps) {
  const { event, start, continuesBefore } = segment
  const { i18n, source, style, attributes } = useSegmentAttributes(
    segment,
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
      <EventTitle event={event} source={source} withLocation />
      {!continuesBefore && <UnreadBadge chatKey={getChatKey(event)} />}
    </button>
  )
}
