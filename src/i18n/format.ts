import { addDays, DAYS_PER_WEEK, fromISODate, MINUTES_PER_HOUR } from '../utils/date.ts'

const atMinutes = (minutes: number) =>
  new Date(2000, 0, 3, Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR)

const REFERENCE_MONDAY = new Date(2000, 0, 3)

const DURATION_UNITS = [
  ['week', 7 * 24 * MINUTES_PER_HOUR],
  ['day', 24 * MINUTES_PER_HOUR],
  ['hour', MINUTES_PER_HOUR],
  ['minute', 1],
] as const

const stripTrailingDot = (label: string) => label.replace(/\.$/, '')

export type Formatter = ReturnType<typeof createFormatter>

export function createFormatter(locale: string, firstDay: number) {
  const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options)
  const weekday = format({ weekday: 'long' })
  const shortWeekday = format({ weekday: 'short' })
  const day = format({ day: '2-digit', month: '2-digit', year: '2-digit' })
  const shortDay = format({ day: '2-digit', month: '2-digit' })
  const fullDay = format({ day: '2-digit', month: '2-digit', year: 'numeric' })
  const month = format({ month: 'long' })
  const monthYear = format({ month: 'long', year: 'numeric' })
  const longDate = format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hourCycle = format({ hour: 'numeric' }).resolvedOptions().hourCycle
  const uses12Hours = hourCycle === 'h11' || hourCycle === 'h12'
  const time = format(uses12Hours ? { hour: 'numeric', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit' })
  const hourOnly = format(uses12Hours ? { hour: 'numeric' } : { hour: '2-digit', minute: '2-digit' })
  const list = new Intl.ListFormat(locale, { type: 'conjunction' })
  const durations = new Map(
    DURATION_UNITS.map(([unit]) => [unit, new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' })]),
  )
  const mondayBasedOrder = Array.from(
    { length: DAYS_PER_WEEK },
    (_, offset) => (firstDay - 1 + offset + DAYS_PER_WEEK) % DAYS_PER_WEEK,
  )

  const weekdayLabels = (formatter: Intl.DateTimeFormat) =>
    mondayBasedOrder.map((weekday) => ({
      weekday,
      label: stripTrailingDot(formatter.format(addDays(REFERENCE_MONDAY, weekday))),
    }))

  const formatMonthTitle = (date: Date) => month.format(date)

  return {
    locale,
    uses12Hours,
    firstDay,
    weekday: (date: Date) => weekday.format(date),
    shortWeekday: (date: Date) => stripTrailingDot(shortWeekday.format(date)),
    day: (date: Date) => day.format(date),
    shortDay: (isoDate: string) => shortDay.format(fromISODate(isoDate)),
    fullDay: (isoDate: string) => fullDay.format(fromISODate(isoDate)),
    longDate: (isoDate: string) => longDate.format(fromISODate(isoDate)),
    monthName: (isoDate: string) => month.format(fromISODate(isoDate)),
    monthYear: (isoDate: string) => monthYear.format(fromISODate(isoDate)),
    time: (minutes: number) => time.format(atMinutes(minutes)),
    hour: (hour: number) => hourOnly.format(atMinutes(hour * MINUTES_PER_HOUR)),
    compactHour: (hour: number) => (uses12Hours ? `${hour % 12 || 12}${hour < 12 ? 'a' : 'p'}` : String(hour)),
    list: (items: readonly string[]) => list.format(items),
    duration: (minutes: number) => {
      const [unit, size] = DURATION_UNITS.find(([, size]) => minutes % size === 0) ?? DURATION_UNITS[3]
      return durations.get(unit)?.format(minutes / size) ?? String(minutes)
    },
    shortWeekdays: weekdayLabels(shortWeekday),
    longWeekdays: weekdayLabels(weekday),
    weekdayName: (mondayBasedIndex: number) => weekday.format(addDays(REFERENCE_MONDAY, mondayBasedIndex)),
    weekTitle: (weekStart: Date) => {
      const weekEnd = addDays(weekStart, DAYS_PER_WEEK - 1)
      const startMonth = formatMonthTitle(weekStart)
      const endMonth = formatMonthTitle(weekEnd)
      const startYear = weekStart.getFullYear()
      const endYear = weekEnd.getFullYear()
      if (startYear !== endYear) return `${startMonth} ${startYear} / ${endMonth} ${endYear}`
      if (startMonth !== endMonth) return `${startMonth} / ${endMonth} ${endYear}`
      return monthYear.format(weekStart)
    },
  }
}
