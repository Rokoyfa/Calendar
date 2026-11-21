import { isCaldavEvent } from '../../../utils/caldav.ts'
import type { CalendarEvent, EventOccurrence } from '../../../utils/event.ts'
import { isExternalEvent } from '../../../utils/externalCalendar.ts'
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
  const isLocked = isCaldav && occurrence ? !canEditEvent(occurrence) : false
  const canChooseCalendar =
    !readOnly &&
    !isExternal &&
    !isLocked &&
    (occurrence === null
      ? canCreate
      : occurrence.seriesId === null && supportsMove && canEditEvent(occurrence) && canMoveEvent(occurrence))
  return { isExternal, isCaldav, isLocked, canChooseCalendar }
}

export const withCurrentCalendar = (
  choices: readonly CalendarChoice[],
  occurrence: EventOccurrence | null,
  currentName: string,
): readonly CalendarChoice[] =>
  occurrence && !choices.some((choice) => choice.id === occurrence.calendarId)
    ? [{ id: occurrence.calendarId, name: currentName }, ...choices]
    : choices
