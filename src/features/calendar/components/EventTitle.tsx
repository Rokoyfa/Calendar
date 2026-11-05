import type { EventOccurrence } from '../../../utils/event.ts'
import { RepeatIcon } from '../../../components/Icons.tsx'

type EventTitleProps = {
  event: EventOccurrence
}

export function EventTitle({ event }: EventTitleProps) {
  return (
    <span className="eventName">
      {event.recurrence && <RepeatIcon size={11} />}
      {event.title}
    </span>
  )
}
