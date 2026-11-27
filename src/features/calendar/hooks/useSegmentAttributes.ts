import { useI18n } from '../../../i18n/index.ts'
import type { ClassNameValue } from '../../../utils/classNames.ts'
import { useOwnAttendance } from '../context/CurrentUserContext.ts'
import { useIsDragging } from '../context/DragContext.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { getEventDetails, getEventLabel, getSegmentAttributes } from '../utils/eventLabels.ts'
import { useEventSource } from './useEventSource.ts'
import { isPlanPreviewEvent } from '../../tasks/index.ts'

export function useSegmentAttributes(segment: EventSegment, ...classNames: ClassNameValue[]) {
  const i18n = useI18n()
  const source = useEventSource(segment.event)
  const isDragging = useIsDragging(segment.event.occurrenceKey)
  const attendance = useOwnAttendance(segment.event)
  const { style, ...attributes } = getSegmentAttributes(
    segment,
    source,
    i18n,
    ...classNames,
    isDragging && 'eventDragging',
    attendance === 'declined' && 'eventDeclined',
    attendance === 'needsAction' && 'eventUnanswered',
    isPlanPreviewEvent(segment.event) && 'eventPlanned',
  )
  const label = getEventLabel(segment.event, source, attendance, i18n)
  const details = getEventDetails(segment.event, source, attendance, i18n)
  return { i18n, source, isDragging, style, attributes, label, details }
}
