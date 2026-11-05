import { formatEventPeriod, getEventColorAttributes, type EventOccurrence } from '../../../utils/event.ts'
import { formatRecurrence } from '../../../utils/recurrence.ts'
import type { ClassNameValue } from '../../../utils/classNames.ts'
import type { EventSegment } from '../types/eventLayout.ts'

export const getRecurrenceText = (event: EventOccurrence) =>
  event.recurrence ? formatRecurrence(event.recurrence, event.startDate) : null

export const getEventTooltip = (event: EventOccurrence) =>
  [`${formatEventPeriod(event)}: ${event.title}`, getRecurrenceText(event)].filter(Boolean).join('\n')

export const getSegmentAttributes = (
  { event, continuesBefore, continuesAfter }: EventSegment,
  ...classNamesToMerge: ClassNameValue[]
) => ({
  ...getEventColorAttributes(
    event.color,
    ...classNamesToMerge,
    continuesBefore && 'eventContinuesBefore',
    continuesAfter && 'eventContinuesAfter',
  ),
  title: getEventTooltip(event),
})
