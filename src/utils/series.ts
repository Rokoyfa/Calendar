import { addDaysToISODate, daysBetween } from './date.ts'
import { toEventInput, type CalendarEvent, type EventInput } from './event.ts'
import { countOccurrencesBefore, getOccurrenceDates, isSameRecurrence, shiftWeekdays, type Recurrence } from './recurrence.ts'

type SeriesRule = Pick<CalendarEvent, 'recurrence' | 'excludedDates'> & { seriesStartDate: string }

export const hasEarlierOccurrences = ({ recurrence, excludedDates, seriesStartDate }: SeriesRule, date: string) => {
  if (!recurrence || date <= seriesStartDate) return false
  const excluded = new Set(excludedDates)
  return getOccurrenceDates(seriesStartDate, recurrence, seriesStartDate, addDaysToISODate(date, -1)).some(
    (occurrence) => !excluded.has(occurrence),
  )
}

const followShift = (previous: Recurrence | null, next: Recurrence | null, shift: number) =>
  next !== null && shift !== 0 && next.frequency === 'weekly' && isSameRecurrence(previous, next)
    ? { ...next, weekdays: shiftWeekdays(next.weekdays, shift) }
    : next

const shiftDates = (dates: readonly string[], shift: number) => dates.map((date) => addDaysToISODate(date, shift))

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

export const getShift = (occurrenceDate: string, input: EventInput) => daysBetween(occurrenceDate, input.startDate)

export const changeWholeSeries = (series: CalendarEvent, occurrenceDate: string, input: EventInput): EventInput => {
  if (input.recurrence === null) return { ...input, excludedDates: [], seriesId: null, originalDate: null }

  const shift = getShift(occurrenceDate, input)
  const startDate = addDaysToISODate(series.startDate, shift)
  return {
    ...input,
    startDate,
    endDate: addDaysToISODate(startDate, daysBetween(input.startDate, input.endDate)),
    recurrence: followShift(series.recurrence, input.recurrence, shift),
    excludedDates: shiftDates(series.excludedDates, shift),
    seriesId: null,
    originalDate: null,
  }
}

export const truncateSeries = (series: CalendarEvent, occurrenceDate: string): EventInput => {
  const lastDate = addDaysToISODate(occurrenceDate, -1)
  const recurrence = series.recurrence
  return {
    ...toEventInput(series),
    recurrence: recurrence && {
      ...recurrence,
      until: recurrence.until !== null && recurrence.until < lastDate ? recurrence.until : lastDate,
      count: null,
    },
    excludedDates: series.excludedDates.filter((date) => date < occurrenceDate),
  }
}

export const continueSeries = (series: CalendarEvent, occurrenceDate: string, input: EventInput): EventInput => {
  if (input.recurrence === null) return { ...input, excludedDates: [], seriesId: null, originalDate: null }

  const shift = getShift(occurrenceDate, input)
  const keepsRule = isSameRecurrence(series.recurrence, input.recurrence)
  const remaining =
    keepsRule && series.recurrence && input.recurrence.count !== null
      ? input.recurrence.count - countOccurrencesBefore(series.startDate, series.recurrence, occurrenceDate)
      : input.recurrence.count
  const recurrence = followShift(series.recurrence, input.recurrence, shift)

  return {
    ...input,
    recurrence: recurrence && { ...recurrence, count: remaining === null ? null : Math.max(remaining, 1) },
    excludedDates: keepsRule
      ? shiftDates(
          series.excludedDates.filter((date) => date >= occurrenceDate),
          shift,
        )
      : [],
    seriesId: null,
    originalDate: null,
  }
}
