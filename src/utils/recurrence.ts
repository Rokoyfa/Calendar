import {
  addDaysToISODate,
  daysBetween,
  DAYS_PER_WEEK,
  formatShortDay,
  fromISODate,
  ISO_DATE_PATTERN,
  toISODate,
} from './date.ts'

export const RECURRENCE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number]

export type Recurrence = {
  frequency: RecurrenceFrequency
  interval: number
  weekdays: number[]
  until: string | null
}

export const RECURRENCE_INTERVAL_MAX = 99

export const WEEKDAY_SHORT_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const

const WEEKDAY_LABELS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  yearly: 'Jährlich',
}

export const RECURRENCE_UNIT_LABELS: Record<RecurrenceFrequency, { one: string; many: string }> = {
  daily: { one: 'Tag', many: 'Tage' },
  weekly: { one: 'Woche', many: 'Wochen' },
  monthly: { one: 'Monat', many: 'Monate' },
  yearly: { one: 'Jahr', many: 'Jahre' },
}

export const getWeekdayIndex = (isoDate: string) => (fromISODate(isoDate).getDay() + 6) % DAYS_PER_WEEK

export const isRecurrenceFrequency = (value: unknown): value is RecurrenceFrequency =>
  RECURRENCE_FREQUENCIES.includes(value as RecurrenceFrequency)

export const createRecurrence = (frequency: RecurrenceFrequency, startDate: string): Recurrence => ({
  frequency,
  interval: 1,
  weekdays: [getWeekdayIndex(startDate)],
  until: null,
})

export const parseRecurrence = (value: unknown): Recurrence | null => {
  if (typeof value !== 'object' || value === null) return null
  const { frequency, interval, weekdays, until } = value as Record<string, unknown>
  if (!isRecurrenceFrequency(frequency)) return null
  if (typeof interval !== 'number' || !Number.isInteger(interval) || interval < 1) return null
  if (!Array.isArray(weekdays) || !weekdays.every((day) => Number.isInteger(day) && day >= 0 && day < 7)) return null
  if (until !== null && (typeof until !== 'string' || !ISO_DATE_PATTERN.test(until))) return null
  return { frequency, interval, weekdays: normalizeWeekdays(weekdays as number[]), until }
}

export const normalizeWeekdays = (weekdays: readonly number[]) => [...new Set(weekdays)].toSorted((a, b) => a - b)

export const isSameRecurrence = (a: Recurrence | null, b: Recurrence | null) => {
  if (a === null || b === null) return a === b
  return (
    a.frequency === b.frequency &&
    a.interval === b.interval &&
    a.until === b.until &&
    (a.frequency !== 'weekly' ||
      normalizeWeekdays(a.weekdays).join() === normalizeWeekdays(b.weekdays).join())
  )
}

export const shiftWeekdays = (weekdays: readonly number[], days: number) =>
  normalizeWeekdays(weekdays.map((day) => (((day + days) % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK))

export type RecurrenceValidationErrors = Partial<Record<'interval' | 'weekdays' | 'until', string>>

export const validateRecurrence = (recurrence: Recurrence, startDate: string): RecurrenceValidationErrors => {
  const errors: RecurrenceValidationErrors = {}
  const { interval, frequency, weekdays, until } = recurrence

  if (!Number.isInteger(interval) || interval < 1 || interval > RECURRENCE_INTERVAL_MAX)
    errors.interval = `Bitte eine ganze Zahl von 1 bis ${RECURRENCE_INTERVAL_MAX} eingeben.`

  if (frequency === 'weekly' && weekdays.length === 0) errors.weekdays = 'Bitte mindestens einen Wochentag wählen.'

  if (until !== null) {
    if (!ISO_DATE_PATTERN.test(until)) errors.until = 'Bitte ein gültiges Datum wählen.'
    else if (ISO_DATE_PATTERN.test(startDate) && until < startDate)
      errors.until = 'Das Ende der Wiederholung darf nicht vor dem Startdatum liegen.'
  }

  return errors
}

const joinLabels = (labels: readonly string[]) =>
  labels.length <= 1 ? labels.join('') : `${labels.slice(0, -1).join(', ')} und ${labels.at(-1)}`

export const formatRecurrence = (recurrence: Recurrence, startDate: string) => {
  const { frequency, interval, weekdays, until } = recurrence
  const unit = RECURRENCE_UNIT_LABELS[frequency]
  const base = interval === 1 ? RECURRENCE_FREQUENCY_LABELS[frequency] : `Alle ${interval} ${unit.many}`
  const start = fromISODate(startDate)

  const detail =
    frequency === 'weekly'
      ? ` am ${joinLabels(normalizeWeekdays(weekdays).map((day) => WEEKDAY_LABELS[day]))}`
      : frequency === 'monthly'
        ? ` am ${start.getDate()}.`
        : frequency === 'yearly'
          ? ` am ${formatShortDay(startDate)}`
          : ''

  return `${base}${detail}${until ? ` bis ${formatShortDay(until)}${fromISODate(until).getFullYear()}` : ''}`
}

const monthDate = (year: number, monthIndex: number, day: number) => {
  const date = new Date(year, monthIndex, day)
  return date.getDate() === day ? toISODate(date) : null
}

export function getOccurrenceDates(
  seriesStart: string,
  recurrence: Recurrence,
  windowStart: string,
  windowEnd: string,
): string[] {
  const { frequency, interval, until } = recurrence
  const from = windowStart > seriesStart ? windowStart : seriesStart
  const to = until !== null && until < windowEnd ? until : windowEnd
  if (from > to) return []

  const dates: string[] = []
  const accept = (date: string | null) => {
    if (date !== null && date >= from && date <= to) dates.push(date)
  }

  if (frequency === 'daily') {
    const firstStep = Math.ceil(daysBetween(seriesStart, from) / interval)
    for (let step = firstStep; ; step++) {
      const date = addDaysToISODate(seriesStart, step * interval)
      if (date > to) break
      accept(date)
    }
    return dates
  }

  if (frequency === 'weekly') {
    const anchor = addDaysToISODate(seriesStart, -getWeekdayIndex(seriesStart))
    const weekdays = normalizeWeekdays(recurrence.weekdays)
    const firstWeek = Math.floor(daysBetween(anchor, from) / DAYS_PER_WEEK)
    const firstStep = Math.floor(firstWeek / interval)
    for (let step = firstStep; ; step++) {
      const weekStart = addDaysToISODate(anchor, step * interval * DAYS_PER_WEEK)
      if (weekStart > to) break
      for (const weekday of weekdays) accept(addDaysToISODate(weekStart, weekday))
    }
    return dates
  }

  const start = fromISODate(seriesStart)
  const fromDate = fromISODate(from)
  const day = start.getDate()

  if (frequency === 'monthly') {
    const monthsUntilFrom =
      (fromDate.getFullYear() - start.getFullYear()) * 12 + fromDate.getMonth() - start.getMonth()
    for (let step = Math.max(Math.floor(monthsUntilFrom / interval), 0); ; step++) {
      const firstOfMonth = new Date(start.getFullYear(), start.getMonth() + step * interval, 1)
      if (toISODate(firstOfMonth) > to) break
      accept(monthDate(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), day))
    }
    return dates
  }

  const yearsUntilFrom = fromDate.getFullYear() - start.getFullYear()
  for (let step = Math.max(Math.floor(yearsUntilFrom / interval), 0); ; step++) {
    const year = start.getFullYear() + step * interval
    if (`${year}` > to.slice(0, 4)) break
    accept(monthDate(year, start.getMonth(), day))
  }
  return dates
}
