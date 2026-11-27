import type { PopoverAnchor } from '../../../components/AnchoredPopover.tsx'
import { useHost } from '../../../context/HostContext.ts'
import type { CalendarEvent, EventOccurrence } from '../../../domain/event.ts'
import { getEditorAccess } from '../utils/editorAccess.ts'
import { EventPeek } from './EventPeek.tsx'

type CalendarEventPeekProps = {
  occurrence: EventOccurrence
  anchor: PopoverAnchor
  readOnly: boolean
  canCreate: boolean
  supportsMove: boolean
  canEditEvent: (event: CalendarEvent) => boolean
  canMoveEvent: (event: CalendarEvent) => boolean
  onOpen: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

export function CalendarEventPeek({
  occurrence,
  anchor,
  readOnly,
  canCreate,
  supportsMove,
  canEditEvent,
  canMoveEvent,
  onOpen,
  onDuplicate,
  onDelete,
  onClose,
}: CalendarEventPeekProps) {
  const { features } = useHost()
  const { isExternal, isPeer, isLocked } = getEditorAccess({
    occurrence,
    readOnly,
    canCreate,
    supportsMove,
    canEditEvent,
    canMoveEvent,
  })
  const canEdit = !readOnly && !isExternal && !isLocked
  const isOwnRequest = isPeer && occurrence.request?.mine === true
  return (
    <EventPeek
      occurrence={occurrence}
      anchor={anchor}
      canEdit={canEdit}
      onOpen={onOpen}
      onDuplicate={features.duplicate && canCreate && !isPeer && !isExternal ? onDuplicate : undefined}
      onDelete={canEdit && (!isPeer || isOwnRequest) ? onDelete : undefined}
      onClose={onClose}
    />
  )
}
