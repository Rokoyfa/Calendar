export const DAYS_PER_WEEK = 7
export const HOURS_PER_DAY = 24
export const MINUTES_PER_HOUR = 60
export const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR
const MS_PER_DAY = 86_400_000

export const ISO_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const isISODate = (value: unknown): value is string => typeof value === 'string' && ISO_DATE_PATTERN.test(value)

export const isTime = (value: unknown): value is string => typeof value === 'string' && TIME_PATTERN.test(value)

const pad = (value: number) => String(value).padStart(2, '0')

const parseISODate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return { year, monthIndex: month - 1, day }
}

export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const fromISODate = (isoDate: string) => {
  const { year, monthIndex, day } = parseISODate(isoDate)
  return new Date(year, monthIndex, day)
}

export const minISODate = (a: string, b: string) => (a < b ? a : b)

export const maxISODate = (a: string, b: string) => (a > b ? a : b)

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * MINUTES_PER_HOUR + minutes
}

export const minutesToTime = (totalMinutes: number) =>
  `${pad(Math.floor(totalMinutes / MINUTES_PER_HOUR))}:${pad(totalMinutes % MINUTES_PER_HOUR)}`

export const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)

export const addDaysToISODate = (isoDate: string, amount: number) => toISODate(addDays(fromISODate(isoDate), amount))

export const addMonthsToISODate = (isoDate: string, amount: number) => {
  const { year, monthIndex, day } = parseISODate(isoDate)
  return toISODate(new Date(year, monthIndex + amount, day))
}

const toUTCTime = (isoDate: string) => {
  const { year, monthIndex, day } = parseISODate(isoDate)
  return Date.UTC(year, monthIndex, day)
}

export const daysBetween = (fromIsoDate: string, toIsoDate: string) =>
  Math.round((toUTCTime(toIsoDate) - toUTCTime(fromIsoDate)) / MS_PER_DAY)

export const daysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate()

export const getWeekdayIndex = (date: Date) => (date.getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK

export const startOfWeek = (date: Date) => addDays(date, -getWeekdayIndex(date))

export const isSameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b)

export const getWeekDays = (weekStart: Date) =>
  Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(weekStart, index))

export const getIsoWeek = (date: Date) => {
  const thursday = addDays(date, 3 - getWeekdayIndex(date))
  const yearStart = toISODate(new Date(thursday.getFullYear(), 0, 1))
  return Math.floor(daysBetween(yearStart, toISODate(thursday)) / DAYS_PER_WEEK) + 1
}

export const formatHour = (hour: number) => `${pad(hour)}:00`

const locale = 'de-DE'
const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long' })
const dayFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })
const shortDayFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' })
const fullDayFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long' })

export const formatWeekday = (date: Date) => weekdayFormat.format(date)

export const formatDay = (date: Date) => dayFormat.format(date)

export const formatShortDay = (isoDate: string) => shortDayFormat.format(fromISODate(isoDate))

export const formatFullDay = (isoDate: string) => fullDayFormat.format(fromISODate(isoDate))

export const formatWeekTitle = (weekStart: Date) => {
  const weekEnd = addDays(weekStart, DAYS_PER_WEEK - 1)
  const startMonth = monthFormat.format(weekStart)
  const endMonth = monthFormat.format(weekEnd)
  const startYear = weekStart.getFullYear()
  const endYear = weekEnd.getFullYear()

  if (startYear !== endYear) return `${startMonth} ${startYear} / ${endMonth} ${endYear}`
  if (startMonth !== endMonth) return `${startMonth} / ${endMonth} ${endYear}`
  return `${startMonth} ${endYear}`
}
