import type { EventOccurrence } from '../../../utils/event.ts'
import { RepeatIcon, TeamIcon } from '../../../components/Icons.tsx'
import type { EventSource } from '../types/eventSource.ts'

type EventTitleProps = {
  event: EventOccurrence
  source?: EventSource
}

export function EventTitle({ event, source }: EventTitleProps) {
  return (
    <span className="eventName">
      {source && <TeamIcon size={11} />}
      {event.recurrence && <RepeatIcon size={11} />}
      {event.title}
    </span>
  )
}
