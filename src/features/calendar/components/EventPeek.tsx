import type { KeyboardEvent } from 'react'
import { AnchoredPopover, type PopoverAnchor } from '../../../components/AnchoredPopover.tsx'
import { Button } from '../../../components/Button.tsx'
import { CloseIcon, CopyIcon, MapPinIcon, TrashIcon } from '../../../components/Icons.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { formatEventPeriod, getEventColorAttributes, type EventOccurrence } from '../../../domain/event.ts'
import { useLocationUrl } from '../../../hooks/useLocationUrl.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useOwnAttendance } from '../context/CurrentUserContext.ts'
import { useEventSource } from '../hooks/useEventSource.ts'
import { getRecurrenceText, getSourceText } from '../utils/eventLabels.ts'
import { EVENT_ACTION_KEYS, getEventKeyAction } from '../utils/eventKeys.ts'
import { EventLinks } from './EventLinks.tsx'

type EventPeekProps = {
  occurrence: EventOccurrence
  anchor: PopoverAnchor
  canEdit: boolean
  onOpen: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onClose: () => void
}

export function EventPeek({ occurrence, anchor, canEdit, onOpen, onDuplicate, onDelete, onClose }: EventPeekProps) {
  const i18n = useI18n()
  const { m } = i18n
  const source = useEventSource(occurrence)
  const attendance = useOwnAttendance(occurrence)
  const locationUrl = useLocationUrl()(occurrence.location)
  const recurrence = getRecurrenceText(occurrence, i18n)
  const attendees = occurrence.attendees.length
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.repeat || event.defaultPrevented) return
    const action = getEventKeyAction(event, { open: onOpen, duplicate: onDuplicate, remove: onDelete })
    if (!action) return
    event.preventDefault()
    action()
  }

  return (
    <AnchoredPopover
      anchor={anchor}
      label={occurrence.title}
      className="eventPeek"
      keyShortcuts={EVENT_ACTION_KEYS}
      onKeyDown={handleKeyDown}
      onClose={onClose}
    >
      <div className="eventPeekHeader">
        <span {...getEventColorAttributes(occurrence.color, 'eventPeekColor')} aria-hidden="true" />
        <h2 className="eventPeekTitle">{occurrence.title}</h2>
        <IconButton label={m.common.close} plain onClick={onClose}>
          <CloseIcon size={16} />
        </IconButton>
      </div>
      <p className="eventPeekWhen">{formatEventPeriod(occurrence, i18n)}</p>
      {recurrence && <p className="eventPeekLine">{recurrence}</p>}
      {occurrence.location && (
        <p className="eventPeekLine eventPeekLocation">
          <MapPinIcon size={14} />
          {locationUrl ? (
            <a href={locationUrl} target="_blank" rel="noopener noreferrer">
              {occurrence.location}
            </a>
          ) : (
            occurrence.location
          )}
        </p>
      )}
      {occurrence.links.length > 0 && <EventLinks links={occurrence.links} lines={occurrence.links.length} />}
      {source && <p className="eventPeekLine eventPeekMuted">{getSourceText(source, i18n)}</p>}
      {attendees > 0 && (
        <p className="eventPeekLine eventPeekMuted">
          {[
            m.calendar.peek.attendees(attendees),
            attendance && m.calendar.ownResponse(m.events.attendeeStatus[attendance]),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {occurrence.description && <p className="eventPeekDescription">{occurrence.description}</p>}
      <div className="eventPeekActions">
        {onDelete && (
          <IconButton label={m.common.delete} plain onClick={onDelete}>
            <TrashIcon size={18} />
          </IconButton>
        )}
        {onDuplicate && (
          <IconButton label={m.events.duplicate} plain onClick={onDuplicate}>
            <CopyIcon size={18} />
          </IconButton>
        )}
        <Button className="eventPeekOpen" data-autofocus onClick={onOpen}>
          {canEdit ? m.calendar.peek.edit : m.calendar.peek.details}
        </Button>
      </div>
    </AnchoredPopover>
  )
}
