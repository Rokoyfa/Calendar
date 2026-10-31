import { addDaysToISODate, daysBetween, minISODate } from './date.ts'
import {
  getActiveOccurrenceDates,
  moveToStartDate,
  NO_SERIES_LINK,
  toEventInput,
  type CalendarEvent,
  type EventInput,
  type SeriesRule,
} from './event.ts'
import { countOccurrencesBefore, isSameRecurrence, shiftWeekdays, type Recurrence } from './recurrence.ts'

export const hasEarlierOccurrences = (series: SeriesRule, date: string) =>
  series.recurrence !== null &&
  date > series.startDate &&
  getActiveOccurrenceDates(series, series.startDate, addDaysToISODate(date, -1)).length > 0

export const getShift = (occurrenceDate: string, input: EventInput) => daysBetween(occurrenceDate, input.startDate)

export const isDetachedFrom = (event: CalendarEvent, date: string) =>
  event.originalDate !== null && event.originalDate >= date

const shiftDates = (dates: readonly string[], shift: number) => dates.map((date) => addDaysToISODate(date, shift))

const followShift = (previous: Recurrence | null, next: Recurrence, shift: number) =>
  shift !== 0 && next.frequency === 'weekly' && isSameRecurrence(previous, next)
    ? { ...next, weekdays: shiftWeekdays(next.weekdays, shift) }
    : next

const asSingleEvent = (input: EventInput): EventInput => ({ ...input, excludedDates: [], ...NO_SERIES_LINK })

export const excludeOccurrence = (series: CalendarEvent, occurrenceDate: string): EventInput => ({
  ...toEventInput(series),
  excludedDates: [...new Set([...series.excludedDates, occurrenceDate])].toSorted(),
})

export const detachOccurrence = (series: CalendarEvent, occurrenceDate: string, input: EventInput): EventInput => ({
  ...input,
  recurrence: null,
  excludedDates: [],
  seriesId: series.id,
  originalDate: occurrenceDate,
})

export const changeWholeSeries = (series: CalendarEvent, occurrenceDate: string, input: EventInput): EventInput => {
  if (input.recurrence === null) return asSingleEvent(input)

  const shift = getShift(occurrenceDate, input)
  return {
    ...input,
    ...moveToStartDate(input, addDaysToISODate(series.startDate, shift)),
    recurrence: followShift(series.recurrence, input.recurrence, shift),
    excludedDates: shiftDates(series.excludedDates, shift),
    ...NO_SERIES_LINK,
  }
}

export const truncateSeries = (series: CalendarEvent, occurrenceDate: string): EventInput => {
  const lastDate = addDaysToISODate(occurrenceDate, -1)
  const { recurrence } = series
  return {
    ...toEventInput(series),
    recurrence: recurrence && {
      ...recurrence,
      until: recurrence.until === null ? lastDate : minISODate(recurrence.until, lastDate),
      count: null,
    },
    excludedDates: series.excludedDates.filter((date) => date < occurrenceDate),
  }
}

export const continueSeries = (series: CalendarEvent, occurrenceDate: string, input: EventInput): EventInput => {
  if (input.recurrence === null) return asSingleEvent(input)

  const shift = getShift(occurrenceDate, input)
  const keepsRule = isSameRecurrence(series.recurrence, input.recurrence)
  const { count } = input.recurrence
  const remaining =
    keepsRule && series.recurrence && count !== null
      ? Math.max(count - countOccurrencesBefore(series.startDate, series.recurrence, occurrenceDate), 1)
      : count

  return {
    ...input,
    recurrence: { ...followShift(series.recurrence, input.recurrence, shift), count: remaining },
    excludedDates: keepsRule
      ? shiftDates(
          series.excludedDates.filter((date) => date >= occurrenceDate),
          shift,
        )
      : [],
    ...NO_SERIES_LINK,
  }
}
