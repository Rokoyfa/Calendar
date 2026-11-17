import { withoutPropagation } from '../../../utils/dom.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { useSegmentAttributes } from '../hooks/useSegmentAttributes.ts'
import { EventTitle } from './EventTitle.tsx'
import { EVENT_NAVIGATION_KEYS } from '../hooks/useEventNavigation.ts'
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
  const { i18n, source, style, attributes, details } = useSegmentAttributes(
    segment,
    'eventChip',
    isContinuation && 'eventChipContinuation',
  )

  return (
    <button
      type="button"
      {...attributes}
      aria-keyshortcuts={EVENT_NAVIGATION_KEYS}
      data-event-target=""
      style={row === undefined ? style : { ...style, gridRow: row + 1 }}
      onClick={withoutPropagation(() => onSelect(event))}
    >
      {!continuesBefore && !event.allDay && <span className="eventChipTime">{i18n.format.time(start)}</span>}
      <EventTitle event={event} source={source} withLocation />
      {!continuesBefore && <UnreadBadge chatKey={getChatKey(event)} />}
      <span className="visuallyHidden">, {details}</span>
    </button>
  )
}
