import type { I18n } from '../../../i18n/index.ts'
import {
  formatEventPeriod,
  getEventColorAttributes,
  getLinkName,
  type AttendeeStatus,
  type EventOccurrence,
} from '../../../domain/event.ts'
import { formatRecurrence } from '../../../domain/recurrence.ts'
import type { ClassNameValue } from '../../../utils/classNames.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { EventSource } from '../types/eventSource.ts'

type LabelI18n = Pick<I18n, 'm' | 'format'>

const getRecurrenceText = (event: EventOccurrence, i18n: LabelI18n) =>
  event.recurrence ? formatRecurrence(event.recurrence, event.startDate, i18n) : null

export const getSourceText = (source: EventSource, { m }: LabelI18n) => m.calendar.fromCalendar(source.name)

const getEventTooltip = (event: EventOccurrence, source: EventSource | undefined, i18n: LabelI18n) =>
  [
    `${formatEventPeriod(event, i18n)}: ${event.title}`,
    event.location,
    ...event.links.map(getLinkName),
    getRecurrenceText(event, i18n),
    source && getSourceText(source, i18n),
  ]
    .filter(Boolean)
    .join('\n')

export const getEventLabel = (
  event: EventOccurrence,
  source: EventSource | undefined,
  attendance: AttendeeStatus | undefined,
  i18n: LabelI18n,
) =>
  [
    `${event.title}, ${formatEventPeriod(event, i18n)}`,
    event.location,
    getRecurrenceText(event, i18n),
    source && getSourceText(source, i18n),
    attendance && i18n.m.calendar.ownResponse(i18n.m.events.attendeeStatus[attendance]),
    event.attachmentCount > 0 && i18n.m.events.attachments.count(event.attachmentCount),
  ]
    .filter(Boolean)
    .join(', ')

export const getEventDetails = (
  event: EventOccurrence,
  source: EventSource | undefined,
  attendance: AttendeeStatus | undefined,
  i18n: LabelI18n,
) =>
  [
    formatEventPeriod(event, i18n),
    getRecurrenceText(event, i18n),
    source && getSourceText(source, i18n),
    attendance && i18n.m.calendar.ownResponse(i18n.m.events.attendeeStatus[attendance]),
  ]
    .filter(Boolean)
    .join(', ')

export const getDayLabel = (date: string, isToday: boolean, holidays: readonly string[], i18n: LabelI18n) =>
  [
    i18n.format.longDate(date),
    isToday && i18n.m.calendar.todayMark,
    holidays.length > 0 && i18n.m.calendar.holiday(holidays.join(', ')),
  ]
    .filter(Boolean)
    .join(', ')

export const getSegmentAttributes = (
  { event, continuesBefore, continuesAfter }: EventSegment,
  source: EventSource | undefined,
  i18n: LabelI18n,
  ...classNamesToMerge: ClassNameValue[]
) => ({
  ...getEventColorAttributes(
    event.color,
    ...classNamesToMerge,
    continuesBefore && 'eventContinuesBefore',
    continuesAfter && 'eventContinuesAfter',
  ),
  title: getEventTooltip(event, source, i18n),
  'data-occurrence-key': event.occurrenceKey,
})
