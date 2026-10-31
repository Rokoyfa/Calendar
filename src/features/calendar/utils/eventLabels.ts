import { formatEventPeriod, type EventOccurrence } from '../../../utils/event.ts'
import { formatRecurrence } from '../../../utils/recurrence.ts'

export const getRecurrenceText = (event: EventOccurrence) =>
  event.recurrence ? formatRecurrence(event.recurrence, event.startDate) : null

export const getEventTooltip = (event: EventOccurrence) =>
  [`${formatEventPeriod(event)}: ${event.title}`, getRecurrenceText(event)].filter(Boolean).join('\n')
