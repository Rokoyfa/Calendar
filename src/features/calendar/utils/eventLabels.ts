import type { I18n } from '../../../i18n/index.ts'
import { formatEventPeriod, getEventColorAttributes, type EventOccurrence } from '../../../utils/event.ts'
import { formatRecurrence } from '../../../utils/recurrence.ts'
import type { ClassNameValue } from '../../../utils/classNames.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { EventSource } from '../types/eventSource.ts'

type LabelI18n = Pick<I18n, 'm' | 'format'>

export const getRecurrenceText = (event: EventOccurrence, i18n: LabelI18n) =>
  event.recurrence ? formatRecurrence(event.recurrence, event.startDate, i18n) : null

export const getSourceText = (source: EventSource, { m }: LabelI18n) => m.calendar.fromCalendar(source.name)

export const getEventTooltip = (event: EventOccurrence, source: EventSource | undefined, i18n: LabelI18n) =>
  [
    `${formatEventPeriod(event, i18n)}: ${event.title}`,
    getRecurrenceText(event, i18n),
    source && getSourceText(source, i18n),
  ]
    .filter(Boolean)
    .join('\n')

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
})
