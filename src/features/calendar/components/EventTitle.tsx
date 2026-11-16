import { useI18n } from '../../../i18n/index.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import { PaperclipIcon, RepeatIcon, TeamIcon } from '../../../components/Icons.tsx'
import type { EventSource } from '../types/eventSource.ts'

type EventTitleProps = {
  event: EventOccurrence
  source?: EventSource
  withLocation?: boolean
}

export function EventTitle({ event, source, withLocation = false }: EventTitleProps) {
  const { m } = useI18n()
  return (
    <span className="eventName">
      {source && <TeamIcon size={11} />}
      {event.recurrence && <RepeatIcon size={11} />}
      {event.attachmentCount > 0 && (
        <>
          <PaperclipIcon size={11} />
          <span className="visuallyHidden">{m.events.attachments.count(event.attachmentCount)}</span>
        </>
      )}
      {event.title}
      {withLocation && event.location && <span className="eventNameLocation">{event.location}</span>}
    </span>
  )
}
