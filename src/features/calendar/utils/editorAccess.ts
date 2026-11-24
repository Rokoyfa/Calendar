import { isCaldavEvent } from '../../../utils/caldav.ts'
import type { CalendarEvent, EventOccurrence } from '../../../utils/event.ts'
import { isExternalEvent } from '../../../utils/externalCalendar.ts'
import { isPeerCalendarId, isPeerEvent } from '../../../utils/peerCalendar.ts'
import type { CalendarChoice } from '../../events/index.ts'

type EditorAccessOptions = {
  occurrence: EventOccurrence | null
  readOnly: boolean
  canCreate: boolean
  supportsMove: boolean
  canEditEvent: (event: CalendarEvent) => boolean
  canMoveEvent: (event: CalendarEvent) => boolean
}

export const getEditorAccess = ({
  occurrence,
  readOnly,
  canCreate,
  supportsMove,
  canEditEvent,
  canMoveEvent,
}: EditorAccessOptions) => {
  const isExternal = occurrence ? isExternalEvent(occurrence) : false
  const isCaldav = occurrence ? isCaldavEvent(occurrence) : false
  const isPeer = occurrence ? isPeerEvent(occurrence) : false
  const isLocked = (isCaldav || isPeer) && occurrence ? !canEditEvent(occurrence) : false
  const canChooseCalendar =
    !readOnly &&
    !isExternal &&
    !isPeer &&
    !isLocked &&
    (occurrence === null
      ? canCreate
      : occurrence.seriesId === null && supportsMove && canEditEvent(occurrence) && canMoveEvent(occurrence))
  return { isExternal, isCaldav, isPeer, isLocked, canChooseCalendar }
}

export const withCurrentCalendar = (
  choices: readonly CalendarChoice[],
  occurrence: EventOccurrence | null,
  currentName: string,
): readonly CalendarChoice[] => {
  if (!occurrence) return choices
  const movable = choices.filter((choice) => !isPeerCalendarId(choice.id))
  return movable.some((choice) => choice.id === occurrence.calendarId)
    ? movable
    : [{ id: occurrence.calendarId, name: currentName }, ...movable]
}
