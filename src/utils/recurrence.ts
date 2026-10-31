import {
  addDaysToISODate,
  daysBetween,
  daysInMonth,
  DAYS_PER_WEEK,
  formatFullDay,
  formatShortDay,
  fromISODate,
  getWeekdayIndex,
  isISODate,
  minISODate,
  maxISODate,
  toISODate,
} from './date.ts'
import { integerRangeMessage, isIntegerInRange } from './number.ts'

export const RECURRENCE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number]

export const MONTHLY_MODES = ['dayOfMonth', 'weekdayOfMonth', 'lastWeekdayOfMonth'] as const

export type MonthlyMode = (typeof MONTHLY_MODES)[number]

export type Recurrence = {
  frequency: RecurrenceFrequency
  interval: number
  weekdays: number[]
  monthlyMode: MonthlyMode
  until: string | null
  count: number | null
}

export const RECURRENCE_INTERVAL_MAX = 99
export const RECURRENCE_COUNT_MAX = 999

const MAX_EMPTY_PERIODS = 1000

export const WEEKDAY_SHORT_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const

const WEEKDAY_LABELS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const

const ORDINAL_LABELS = ['ersten', 'zweiten', 'dritten', 'vierten', 'fünften'] as const

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

export const getISODateWeekday = (isoDate: string) => getWeekdayIndex(fromISODate(isoDate))

const getWeekdayOrdinal = (isoDate: string) => Math.ceil(fromISODate(isoDate).getDate() / DAYS_PER_WEEK)

export const isInLastWeekOfMonth = (isoDate: string) => {
  const date = fromISODate(isoDate)
  return date.getDate() + DAYS_PER_WEEK > daysInMonth(date.getFullYear(), date.getMonth())
}

export const isRecurrenceFrequency = (value: unknown): value is RecurrenceFrequency =>
  RECURRENCE_FREQUENCIES.includes(value as RecurrenceFrequency)

export const isMonthlyMode = (value: unknown): value is MonthlyMode => MONTHLY_MODES.includes(value as MonthlyMode)

export const createRecurrence = (frequency: RecurrenceFrequency, startDate: string): Recurrence => ({
  frequency,
  interval: 1,
  weekdays: [getISODateWeekday(startDate)],
  monthlyMode: 'dayOfMonth',
  until: null,
  count: null,
})

const weekdayDistance = (from: number, to: number) => (((to - from) % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK

export const normalizeWeekdays = (weekdays: readonly number[]) => [...new Set(weekdays)].toSorted((a, b) => a - b)

export const parseRecurrence = (value: unknown): Recurrence | null => {
  if (typeof value !== 'object' || value === null) return null
  const { frequency, interval, weekdays, monthlyMode, until, count } = value as Record<string, unknown>
  if (!isRecurrenceFrequency(frequency) || !isIntegerInRange(interval, 1)) return null
  if (!Array.isArray(weekdays) || !weekdays.every((day) => isIntegerInRange(day, 0, DAYS_PER_WEEK - 1))) return null
  if (monthlyMode !== undefined && !isMonthlyMode(monthlyMode)) return null
  if (until != null && !isISODate(until)) return null
  if (count != null && !isIntegerInRange(count, 1)) return null
  return {
    frequency,
    interval,
    weekdays: normalizeWeekdays(weekdays),
    monthlyMode: monthlyMode ?? 'dayOfMonth',
    until: until ?? null,
    count: count ?? null,
  }
}

export const isSameRecurrence = (a: Recurrence | null, b: Recurrence | null) => {
  if (a === null || b === null) return a === b
  return (
    a.frequency === b.frequency &&
    a.interval === b.interval &&
    a.until === b.until &&
    a.count === b.count &&
    (a.frequency !== 'weekly' || normalizeWeekdays(a.weekdays).join() === normalizeWeekdays(b.weekdays).join()) &&
    (a.frequency !== 'monthly' || a.monthlyMode === b.monthlyMode)
  )
}

export const shiftWeekdays = (weekdays: readonly number[], days: number) =>
  normalizeWeekdays(weekdays.map((day) => weekdayDistance(-days, day)))

export const adaptRecurrenceToStart = (recurrence: Recurrence | null, previousStart: string, nextStart: string) => {
  if (!recurrence || !isISODate(previousStart) || !isISODate(nextStart)) return recurrence

  if (recurrence.frequency === 'weekly') {
    const followsStart = recurrence.weekdays.length === 1 && recurrence.weekdays[0] === getISODateWeekday(previousStart)
    return followsStart ? { ...recurrence, weekdays: [getISODateWeekday(nextStart)] } : recurrence
  }

  if (recurrence.frequency === 'monthly' && recurrence.monthlyMode === 'lastWeekdayOfMonth' && !isInLastWeekOfMonth(nextStart))
    return { ...recurrence, monthlyMode: 'weekdayOfMonth' as const }

  return recurrence
}

export const hasRecurrenceErrors = (errors: RecurrenceValidationErrors) => Object.values(errors).some(Boolean)

export type RecurrenceValidationErrors = Partial<Record<'interval' | 'weekdays' | 'until' | 'count', string>>

export const validateRecurrence = (recurrence: Recurrence, startDate: string): RecurrenceValidationErrors => {
  const errors: RecurrenceValidationErrors = {}
  const { interval, frequency, weekdays, until, count } = recurrence

  if (!isIntegerInRange(interval, 1, RECURRENCE_INTERVAL_MAX)) errors.interval = integerRangeMessage(1, RECURRENCE_INTERVAL_MAX)

  if (frequency === 'weekly' && weekdays.length === 0) errors.weekdays = 'Bitte mindestens einen Wochentag wählen.'

  if (until !== null) {
    if (!isISODate(until)) errors.until = 'Bitte ein gültiges Datum wählen.'
    else if (isISODate(startDate) && until < startDate)
      errors.until = 'Das Ende der Wiederholung darf nicht vor dem Startdatum liegen.'
  }

  if (count !== null && !isIntegerInRange(count, 1, RECURRENCE_COUNT_MAX))
    errors.count = integerRangeMessage(1, RECURRENCE_COUNT_MAX)

  return errors
}

const joinLabels = (labels: readonly string[]) =>
  labels.length <= 1 ? labels.join('') : `${labels.slice(0, -1).join(', ')} und ${labels.at(-1)}`

export const formatMonthlyMode = (mode: MonthlyMode, startDate: string) => {
  const weekday = WEEKDAY_LABELS[getISODateWeekday(startDate)]
  if (mode === 'weekdayOfMonth') return `am ${ORDINAL_LABELS[getWeekdayOrdinal(startDate) - 1]} ${weekday}`
  if (mode === 'lastWeekdayOfMonth') return `am letzten ${weekday}`
  return `am ${fromISODate(startDate).getDate()}.`
}

export const getMonthlyModeOptions = (startDate: string): MonthlyMode[] =>
  isInLastWeekOfMonth(startDate) ? [...MONTHLY_MODES] : ['dayOfMonth', 'weekdayOfMonth']

export const formatRecurrence = (recurrence: Recurrence, startDate: string) => {
  const { frequency, interval, weekdays, until, count } = recurrence
  const unit = RECURRENCE_UNIT_LABELS[frequency]
  const base = interval === 1 ? RECURRENCE_FREQUENCY_LABELS[frequency] : `Alle ${interval} ${unit.many}`

  const detail =
    frequency === 'weekly'
      ? ` am ${joinLabels(normalizeWeekdays(weekdays).map((day) => WEEKDAY_LABELS[day]))}`
      : frequency === 'monthly'
        ? ` ${formatMonthlyMode(recurrence.monthlyMode, startDate)}`
        : frequency === 'yearly'
          ? ` am ${formatShortDay(startDate)}`
          : ''

  const end =
    until !== null
      ? ` bis ${formatFullDay(until)}`
      : count !== null
        ? `, ${count === 1 ? 'einmal' : `${count}-mal`}`
        : ''

  return `${base}${detail}${end}`
}

const dayOfMonth = (year: number, monthIndex: number, day: number) =>
  day >= 1 && day <= daysInMonth(year, monthIndex) ? toISODate(new Date(year, monthIndex, day)) : null

const nthWeekdayOfMonth = (year: number, monthIndex: number, weekday: number, ordinal: number) => {
  const firstWeekday = getWeekdayIndex(new Date(year, monthIndex, 1))
  return dayOfMonth(year, monthIndex, 1 + weekdayDistance(firstWeekday, weekday) + (ordinal - 1) * DAYS_PER_WEEK)
}

const lastWeekdayOfMonth = (year: number, monthIndex: number, weekday: number) => {
  const lastDay = daysInMonth(year, monthIndex)
  const lastWeekday = getWeekdayIndex(new Date(year, monthIndex, lastDay))
  return dayOfMonth(year, monthIndex, lastDay - weekdayDistance(weekday, lastWeekday))
}

type Period = { start: string; dates: string[] }

function* periods(seriesStart: string, recurrence: Recurrence, from: string): Generator<Period> {
  const { frequency, interval } = recurrence

  if (frequency === 'daily') {
    for (let step = Math.max(Math.ceil(daysBetween(seriesStart, from) / interval), 0); ; step++) {
      const date = addDaysToISODate(seriesStart, step * interval)
      yield { start: date, dates: [date] }
    }
  }

  if (frequency === 'weekly') {
    const anchor = addDaysToISODate(seriesStart, -getISODateWeekday(seriesStart))
    const weekdays = normalizeWeekdays(recurrence.weekdays)
    const firstWeek = Math.floor(daysBetween(anchor, from) / DAYS_PER_WEEK)
    for (let step = Math.max(Math.floor(firstWeek / interval), 0); ; step++) {
      const weekStart = addDaysToISODate(anchor, step * interval * DAYS_PER_WEEK)
      yield { start: weekStart, dates: weekdays.map((weekday) => addDaysToISODate(weekStart, weekday)) }
    }
  }

  const start = fromISODate(seriesStart)
  const fromDate = fromISODate(from)

  if (frequency === 'monthly') {
    const weekday = getISODateWeekday(seriesStart)
    const ordinal = getWeekdayOrdinal(seriesStart)
    const monthsUntilFrom =
      (fromDate.getFullYear() - start.getFullYear()) * 12 + fromDate.getMonth() - start.getMonth()
    for (let step = Math.max(Math.floor(monthsUntilFrom / interval), 0); ; step++) {
      const month = new Date(start.getFullYear(), start.getMonth() + step * interval, 1)
      const year = month.getFullYear()
      const monthIndex = month.getMonth()
      const date =
        recurrence.monthlyMode === 'weekdayOfMonth'
          ? nthWeekdayOfMonth(year, monthIndex, weekday, ordinal)
          : recurrence.monthlyMode === 'lastWeekdayOfMonth'
            ? lastWeekdayOfMonth(year, monthIndex, weekday)
            : dayOfMonth(year, monthIndex, start.getDate())
      yield { start: toISODate(month), dates: date ? [date] : [] }
    }
  }

  for (let step = Math.max(Math.floor((fromDate.getFullYear() - start.getFullYear()) / interval), 0); ; step++) {
    const year = start.getFullYear() + step * interval
    const date = dayOfMonth(year, start.getMonth(), start.getDate())
    yield { start: `${year}-01-01`, dates: date ? [date] : [] }
  }
}

export function getOccurrenceDates(
  seriesStart: string,
  recurrence: Recurrence,
  windowStart: string,
  windowEnd: string,
): string[] {
  const { until, count } = recurrence
  const last = until === null ? windowEnd : minISODate(until, windowEnd)
  const first = count === null ? maxISODate(windowStart, seriesStart) : seriesStart
  if (first > last) return []

  const dates: string[] = []
  let generated = 0
  let emptyPeriods = 0

  for (const period of periods(seriesStart, recurrence, first)) {
    if (period.start > last) break
    const candidates = period.dates.filter((date) => date >= first && date <= last)
    emptyPeriods = candidates.length === 0 ? emptyPeriods + 1 : 0
    if (emptyPeriods > MAX_EMPTY_PERIODS) break

    for (const date of candidates) {
      generated++
      if (count !== null && generated > count) return dates
      if (date >= windowStart) dates.push(date)
    }
  }

  return dates
}

export const countOccurrencesBefore = (seriesStart: string, recurrence: Recurrence, date: string) =>
  getOccurrenceDates(seriesStart, recurrence, seriesStart, addDaysToISODate(date, -1)).length
