import { formatEventPeriod, getEventColorAttributes, type EventOccurrence } from '../../../utils/event.ts'
import { formatRecurrence } from '../../../utils/recurrence.ts'
import type { ClassNameValue } from '../../../utils/classNames.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { EventSource } from '../types/eventSource.ts'

export const getRecurrenceText = (event: EventOccurrence) =>
  event.recurrence ? formatRecurrence(event.recurrence, event.startDate) : null

export const getSourceText = (source: EventSource) => `Aus dem Kalender „${source.name}“`

export const getEventTooltip = (event: EventOccurrence, source?: EventSource) =>
  [`${formatEventPeriod(event)}: ${event.title}`, getRecurrenceText(event), source && getSourceText(source)]
    .filter(Boolean)
    .join('\n')

export const getSegmentAttributes = (
  { event, continuesBefore, continuesAfter }: EventSegment,
  source: EventSource | undefined,
  ...classNamesToMerge: ClassNameValue[]
) => ({
  ...getEventColorAttributes(
    event.color,
    ...classNamesToMerge,
    continuesBefore && 'eventContinuesBefore',
    continuesAfter && 'eventContinuesAfter',
  ),
  title: getEventTooltip(event, source),
})
