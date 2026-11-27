import { offsetAt } from '../utils/timeZone.ts'

const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000
const RULE_YEAR = 1970
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

const offsetMinutes = (instant: number, timeZone: string) => Math.round(offsetAt(instant, timeZone) / MS_PER_MINUTE)

const formatOffset = (minutes: number) => {
  const absolute = Math.abs(minutes)
  return `${minutes < 0 ? '-' : '+'}${String(Math.floor(absolute / 60)).padStart(2, '0')}${String(absolute % 60).padStart(2, '0')}`
}

const findTransition = (from: number, to: number, timeZone: string) => {
  let low = from
  let high = to
  const before = offsetMinutes(low, timeZone)
  while (high - low > MS_PER_MINUTE) {
    const middle = low + Math.floor((high - low) / 2 / MS_PER_MINUTE) * MS_PER_MINUTE
    if (offsetMinutes(middle, timeZone) === before) low = middle
    else high = middle
  }
  return high
}

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

const nthWeekday = (year: number, month: number, ordinal: number, weekday: number) => {
  if (ordinal > 0) {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
    return 1 + ((weekday - first + 7) % 7) + (ordinal - 1) * 7
  }
  const last = daysInMonth(year, month)
  return last - ((new Date(Date.UTC(year, month - 1, last)).getUTCDay() - weekday + 7) % 7)
}

const ruleFor = (local: Date) => {
  const year = local.getUTCFullYear()
  const month = local.getUTCMonth() + 1
  const day = local.getUTCDate()
  const weekday = local.getUTCDay()
  const ordinal = day + 7 > daysInMonth(year, month) ? -1 : Math.ceil(day / 7)
  const ruleDay = nthWeekday(RULE_YEAR, month, ordinal, weekday)
  const time = `${String(local.getUTCHours()).padStart(2, '0')}${String(local.getUTCMinutes()).padStart(2, '0')}00`
  return {
    start: `${RULE_YEAR}${String(month).padStart(2, '0')}${String(ruleDay).padStart(2, '0')}T${time}`,
    rule: `FREQ=YEARLY;BYMONTH=${month};BYDAY=${ordinal}${WEEKDAYS[weekday]}`,
  }
}

export const vtimezoneLines = (timeZone: string, year: number) => {
  const start = Date.UTC(year, 0, 1)
  const transitions: { at: number; from: number; to: number }[] = []
  let previous = offsetMinutes(start, timeZone)
  for (let day = 1; day <= 366; day += 1) {
    const instant = start + day * MS_PER_DAY
    const offset = offsetMinutes(instant, timeZone)
    if (offset === previous) continue
    transitions.push({ at: findTransition(instant - MS_PER_DAY, instant, timeZone), from: previous, to: offset })
    previous = offset
  }
  const lines = ['BEGIN:VTIMEZONE', `TZID:${timeZone}`]
  if (transitions.length !== 2) {
    const offset = formatOffset(offsetMinutes(start, timeZone))
    lines.push(
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      `TZOFFSETFROM:${offset}`,
      `TZOFFSETTO:${offset}`,
      'END:STANDARD',
    )
  } else
    for (const { at, from, to } of transitions) {
      const kind = to > from ? 'DAYLIGHT' : 'STANDARD'
      const { start: ruleStart, rule } = ruleFor(new Date(at + from * MS_PER_MINUTE))
      lines.push(
        `BEGIN:${kind}`,
        `DTSTART:${ruleStart}`,
        `RRULE:${rule}`,
        `TZOFFSETFROM:${formatOffset(from)}`,
        `TZOFFSETTO:${formatOffset(to)}`,
        `END:${kind}`,
      )
    }
  lines.push('END:VTIMEZONE')
  return lines
}

export const timeZonesOf = (events: readonly { allDay: boolean; timeZone: string | null; startDate: string }[]) => {
  const years = new Map<string, number>()
  for (const event of events)
    if (!event.allDay && event.timeZone && event.timeZone !== 'UTC' && !years.has(event.timeZone))
      years.set(event.timeZone, Number(event.startDate.slice(0, 4)))
  return years
}
