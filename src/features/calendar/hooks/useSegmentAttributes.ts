import { useI18n } from '../../../i18n/index.ts'
import type { ClassNameValue } from '../../../utils/classNames.ts'
import { useIsDragging } from '../context/DragContext.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { getSegmentAttributes } from '../utils/eventLabels.ts'
import { useEventSource } from './useEventSource.ts'

export function useSegmentAttributes(segment: EventSegment, ...classNames: ClassNameValue[]) {
  const i18n = useI18n()
  const source = useEventSource(segment.event)
  const isDragging = useIsDragging(segment.event.occurrenceKey)
  const { style, ...attributes } = getSegmentAttributes(segment, source, i18n, ...classNames, isDragging && 'eventDragging')
  return { i18n, source, isDragging, style, attributes }
}
