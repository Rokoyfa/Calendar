export const DAYS_PER_WEEK = 7
export const HOURS_PER_DAY = 24
export const MINUTES_PER_HOUR = 60
export const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR

export const ISO_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const pad = (value: number) => String(value).padStart(2, '0')

export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const fromISODate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * MINUTES_PER_HOUR + minutes
}

export const minutesToTime = (totalMinutes: number) =>
  `${pad(Math.floor(totalMinutes / MINUTES_PER_HOUR))}:${pad(totalMinutes % MINUTES_PER_HOUR)}`

export const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)

export const addDaysToISODate = (isoDate: string, amount: number) => toISODate(addDays(fromISODate(isoDate), amount))

const toUTCParts = (isoDate: string): [number, number, number] => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return [year, month - 1, day]
}

export const daysBetween = (fromIsoDate: string, toIsoDate: string) =>
  Math.round((Date.UTC(...toUTCParts(toIsoDate)) - Date.UTC(...toUTCParts(fromIsoDate))) / 86_400_000)

export const startOfWeek = (date: Date) =>
  addDays(date, -((date.getDay() + 6) % DAYS_PER_WEEK))

export const isSameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b)

export const getWeekDays = (weekStart: Date) =>
  Array.from({ length: DAYS_PER_WEEK }, (_, index) => addDays(weekStart, index))

export const getIsoWeek = (date: Date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1)
  return Math.ceil(((target.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

export const formatHour = (hour: number) => `${pad(hour)}:00`

const locale = 'de-DE'
const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'long' })
const dayFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })
const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long' })

export const formatWeekday = (date: Date) => weekdayFormat.format(date)

export const formatDay = (date: Date) => dayFormat.format(date)

const shortDayFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' })

export const formatShortDay = (isoDate: string) => shortDayFormat.format(fromISODate(isoDate))

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
