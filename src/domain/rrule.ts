export const RULE_MAX_LENGTH = 500
export const RECURRENCE_DATES_MAX = 100

const DAY_MS = 86_400_000
const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const
const SUB_DAILY = ['HOURLY', 'MINUTELY', 'SECONDLY']
const KNOWN_PARTS = new Set([
  'FREQ',
  'INTERVAL',
  'COUNT',
  'UNTIL',
  'WKST',
  'BYDAY',
  'BYMONTHDAY',
  'BYMONTH',
  'BYYEARDAY',
  'BYWEEKNO',
  'BYSETPOS',
  'BYHOUR',
  'BYMINUTE',
  'BYSECOND',
])
const MAX_EMPTY_PERIODS = 2000
const RULE_PATTERN = /^[A-Z0-9=;,+-]+$/

type Frequency = (typeof FREQUENCIES)[number]

type WeekdayRule = { weekday: number; ordinal: number | null }

export type RuleParts = {
  frequency: Frequency
  interval: number
  byDay: WeekdayRule[]
  byMonthDay: number[]
  byMonth: number[]
  byYearDay: number[]
  byWeekNo: number[]
  bySetPos: number[]
  weekStart: number
}

const dayIndex = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY_MS

const isoOf = (index: number) => new Date(index * DAY_MS).toISOString().slice(0, 10)

const weekdayOf = (index: number) => (new Date(index * DAY_MS).getUTCDay() + 6) % 7

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

const firstOfMonth = (year: number, month: number) => Date.UTC(year, month - 1, 1) / DAY_MS

const isLeapYear = (year: number) => daysInMonth(year, 2) === 29

const numbers = (value: string | undefined, min: number, max: number, allowNegative: boolean) => {
  if (!value) return []
  const result: number[] = []
  for (const part of value.split(',')) {
    const number = Number(part)
    if (!Number.isInteger(number) || number === 0 || Math.abs(number) > max || Math.abs(number) < min) return null
    if (number < 0 && !allowNegative) return null
    result.push(number)
  }
  return [...new Set(result)].sort((a, b) => a - b)
}

const parseWeekdays = (value: string | undefined): WeekdayRule[] | null => {
  if (!value) return []
  const result: WeekdayRule[] = []
  for (const part of value.split(',')) {
    const match = /^([+-]?\d{1,2})?(MO|TU|WE|TH|FR|SA|SU)$/.exec(part)
    if (!match) return null
    const ordinal = match[1] === undefined ? null : Number(match[1])
    if (ordinal !== null && (ordinal === 0 || Math.abs(ordinal) > 53)) return null
    result.push({ weekday: WEEKDAY_CODES.indexOf(match[2]), ordinal })
  }
  return result
}

export const splitRuleParts = (value: string) => {
  const parts = new Map<string, string>()
  for (const part of value.trim().toUpperCase().split(';')) {
    if (part === '') continue
    const [key, ...rest] = part.split('=')
    parts.set(key.trim(), rest.join('=').trim())
  }
  return parts
}

export const parseRuleParts = (value: string): RuleParts | null => {
  const parts = splitRuleParts(value)
  let frequency = parts.get('FREQ') ?? ''
  if (SUB_DAILY.includes(frequency)) frequency = 'DAILY'
  if (!(FREQUENCIES as readonly string[]).includes(frequency)) return null
  const interval = parts.has('INTERVAL') ? Number(parts.get('INTERVAL')) : 1
  if (!Number.isInteger(interval) || interval < 1 || interval > 9999) return null
  const byDay = parseWeekdays(parts.get('BYDAY'))
  const byMonthDay = numbers(parts.get('BYMONTHDAY'), 1, 31, true)
  const byMonth = numbers(parts.get('BYMONTH'), 1, 12, false)
  const byYearDay = numbers(parts.get('BYYEARDAY'), 1, 366, true)
  const byWeekNo = numbers(parts.get('BYWEEKNO'), 1, 53, true)
  const bySetPos = numbers(parts.get('BYSETPOS'), 1, 366, true)
  const weekStart = parts.has('WKST') ? WEEKDAY_CODES.indexOf(parts.get('WKST')!) : 0
  if (!byDay || !byMonthDay || !byMonth || !byYearDay || !byWeekNo || !bySetPos || weekStart < 0) return null
  return {
    frequency: frequency as Frequency,
    interval,
    byDay,
    byMonthDay,
    byMonth,
    byYearDay,
    byWeekNo,
    bySetPos,
    weekStart,
  }
}

export const normalizeRule = (value: string) => {
  const parts = splitRuleParts(value)
  parts.delete('UNTIL')
  parts.delete('COUNT')
  for (const key of parts.keys()) if (!KNOWN_PARTS.has(key) && !key.startsWith('X-')) parts.delete(key)
  const ordered = ['FREQ', ...[...parts.keys()].filter((key) => key !== 'FREQ')]
  return ordered
    .filter((key) => parts.has(key))
    .map((key) => `${key}=${parts.get(key)}`)
    .join(';')
}

export const isRule = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= RULE_MAX_LENGTH &&
  RULE_PATTERN.test(value) &&
  !/(^|;)(UNTIL|COUNT)=/.test(value) &&
  parseRuleParts(value) !== null

const matchesMonthDay = (index: number, monthDays: readonly number[]) => {
  if (monthDays.length === 0) return true
  const date = new Date(index * DAY_MS)
  const day = date.getUTCDate()
  const length = daysInMonth(date.getUTCFullYear(), date.getUTCMonth() + 1)
  return monthDays.some((value) => (value > 0 ? value === day : length + value + 1 === day))
}

const matchesYearDay = (index: number, yearDays: readonly number[]) => {
  if (yearDays.length === 0) return true
  const year = new Date(index * DAY_MS).getUTCFullYear()
  const day = index - Date.UTC(year, 0, 1) / DAY_MS + 1
  const length = isLeapYear(year) ? 366 : 365
  return yearDays.some((value) => (value > 0 ? value === day : length + value + 1 === day))
}

const matchesMonth = (index: number, months: readonly number[]) =>
  months.length === 0 || months.includes(new Date(index * DAY_MS).getUTCMonth() + 1)

const firstWeekOfYear = (year: number, weekStart: number) => {
  const january4 = Date.UTC(year, 0, 4) / DAY_MS
  return january4 - ((weekdayOf(january4) - weekStart + 7) % 7)
}

const matchesWeekNo = (index: number, weekNumbers: readonly number[], weekStart: number) => {
  if (weekNumbers.length === 0) return true
  const year = new Date(index * DAY_MS).getUTCFullYear()
  for (const candidateYear of [year - 1, year, year + 1]) {
    const first = firstWeekOfYear(candidateYear, weekStart)
    const next = firstWeekOfYear(candidateYear + 1, weekStart)
    if (index < first || index >= next) continue
    const week = Math.floor((index - first) / 7) + 1
    const total = (next - first) / 7
    return weekNumbers.some((value) => (value > 0 ? value === week : total + value + 1 === week))
  }
  return false
}

const applyWeekdays = (days: number[], rules: readonly WeekdayRule[], scope: 'month' | 'year' | 'none') => {
  if (rules.length === 0) return days
  const result = new Set<number>()
  const groups = new Map<string, number[]>()
  for (const index of days) {
    const date = new Date(index * DAY_MS)
    const key =
      scope === 'month'
        ? `${date.getUTCFullYear()}-${date.getUTCMonth()}-${weekdayOf(index)}`
        : `${date.getUTCFullYear()}-${weekdayOf(index)}`
    groups.set(key, [...(groups.get(key) ?? []), index])
  }
  for (const rule of rules)
    for (const index of days) {
      if (weekdayOf(index) !== rule.weekday) continue
      if (rule.ordinal === null || scope === 'none') {
        result.add(index)
        continue
      }
      const date = new Date(index * DAY_MS)
      const key =
        scope === 'month'
          ? `${date.getUTCFullYear()}-${date.getUTCMonth()}-${rule.weekday}`
          : `${date.getUTCFullYear()}-${rule.weekday}`
      const group = groups.get(key) ?? []
      const position = group.indexOf(index)
      if (rule.ordinal > 0 ? position === rule.ordinal - 1 : position === group.length + rule.ordinal) result.add(index)
    }
  return days.filter((index) => result.has(index))
}

const applySetPositions = (days: number[], positions: readonly number[]) => {
  if (positions.length === 0) return days
  const picked = positions
    .map((position) => (position > 0 ? days[position - 1] : days[days.length + position]))
    .filter((index): index is number => index !== undefined)
  return [...new Set(picked)].sort((a, b) => a - b)
}

const range = (from: number, length: number) => Array.from({ length }, (_, offset) => from + offset)

const periodDays = (rule: RuleParts, start: number, step: number): { start: number; days: number[] } => {
  const startDate = new Date(start * DAY_MS)
  const startYear = startDate.getUTCFullYear()
  const startMonth = startDate.getUTCMonth() + 1
  const startDay = startDate.getUTCDate()

  if (rule.frequency === 'DAILY') {
    const day = start + step * rule.interval
    const days = [day].filter(
      (index) =>
        matchesMonth(index, rule.byMonth) &&
        matchesMonthDay(index, rule.byMonthDay) &&
        matchesYearDay(index, rule.byYearDay) &&
        (rule.byDay.length === 0 || rule.byDay.some(({ weekday }) => weekday === weekdayOf(index))),
    )
    return { start: day, days }
  }

  if (rule.frequency === 'WEEKLY') {
    const weekStart = start - ((weekdayOf(start) - rule.weekStart + 7) % 7) + step * rule.interval * 7
    const weekdays = rule.byDay.length > 0 ? rule.byDay.map(({ weekday }) => weekday) : [weekdayOf(start)]
    const days = range(weekStart, 7).filter(
      (index) => weekdays.includes(weekdayOf(index)) && matchesMonth(index, rule.byMonth),
    )
    return { start: weekStart, days }
  }

  if (rule.frequency === 'MONTHLY') {
    const monthOffset = startMonth - 1 + step * rule.interval
    const year = startYear + Math.floor(monthOffset / 12)
    const month = (monthOffset % 12) + 1
    const first = firstOfMonth(year, month)
    const all = range(first, daysInMonth(year, month))
    let days: number[]
    if (rule.byMonthDay.length === 0 && rule.byDay.length === 0)
      days = startDay <= all.length ? [first + startDay - 1] : []
    else
      days = applyWeekdays(
        all.filter((index) => matchesMonthDay(index, rule.byMonthDay)),
        rule.byDay,
        'month',
      )
    days = days.filter((index) => matchesMonth(index, rule.byMonth))
    return { start: first, days }
  }

  const year = startYear + step * rule.interval
  const first = Date.UTC(year, 0, 1) / DAY_MS
  const hasDayRules =
    rule.byYearDay.length > 0 || rule.byWeekNo.length > 0 || rule.byMonthDay.length > 0 || rule.byDay.length > 0
  let days: number[]
  if (!hasDayRules) {
    const months = rule.byMonth.length > 0 ? rule.byMonth : [startMonth]
    days = months
      .filter((month) => startDay <= daysInMonth(year, month))
      .map((month) => firstOfMonth(year, month) + startDay - 1)
  } else {
    days = range(first, isLeapYear(year) ? 366 : 365).filter(
      (index) =>
        matchesMonth(index, rule.byMonth) &&
        matchesWeekNo(index, rule.byWeekNo, rule.weekStart) &&
        matchesYearDay(index, rule.byYearDay) &&
        matchesMonthDay(index, rule.byMonthDay),
    )
    const scope = rule.byMonth.length > 0 ? 'month' : rule.byWeekNo.length > 0 ? 'none' : 'year'
    days = applyWeekdays(days, rule.byDay, scope)
  }
  return { start: first, days: days.sort((a, b) => a - b) }
}

const firstStep = (rule: RuleParts, start: number, from: number) => {
  if (from <= start) return 0
  const startDate = new Date(start * DAY_MS)
  const fromDate = new Date(from * DAY_MS)
  if (rule.frequency === 'DAILY') return Math.floor((from - start) / rule.interval)
  if (rule.frequency === 'WEEKLY') return Math.floor((from - start) / 7 / rule.interval) - 1
  if (rule.frequency === 'MONTHLY') {
    const months =
      (fromDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + fromDate.getUTCMonth() - startDate.getUTCMonth()
    return Math.floor(months / rule.interval) - 1
  }
  return Math.floor((fromDate.getUTCFullYear() - startDate.getUTCFullYear()) / rule.interval) - 1
}

export function* rulePeriods(value: string, seriesStart: string, from: string) {
  const rule = parseRuleParts(value)
  if (!rule) {
    yield { start: seriesStart, dates: [seriesStart] }
    return
  }
  const start = dayIndex(seriesStart)
  yield { start: seriesStart, dates: [seriesStart] }
  let empty = 0
  for (let step = Math.max(firstStep(rule, start, dayIndex(from)), 0); ; step++) {
    const period = periodDays(rule, start, step)
    const days = applySetPositions(period.days, rule.bySetPos).filter((index) => index > start)
    empty = days.length === 0 ? empty + 1 : 0
    if (empty > MAX_EMPTY_PERIODS) return
    yield { start: isoOf(Math.max(period.start, start)), dates: days.map(isoOf) }
  }
}

export type SimpleRecurrenceParts = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  weekdays: number[]
  monthlyMode: 'dayOfMonth' | 'weekdayOfMonth' | 'lastWeekdayOfMonth'
}

const ordinalInMonth = (index: number) => Math.ceil(new Date(index * DAY_MS).getUTCDate() / 7)

const isInLastWeek = (index: number) => {
  const date = new Date(index * DAY_MS)
  return date.getUTCDate() + 7 > daysInMonth(date.getUTCFullYear(), date.getUTCMonth() + 1)
}

export const toSimpleRecurrence = (
  value: string,
  seriesStart: string,
): { simple: SimpleRecurrenceParts; exact: boolean } | null => {
  const rule = parseRuleParts(value)
  if (!rule) return null
  const start = dayIndex(seriesStart)
  const startDate = new Date(start * DAY_MS)
  const parts = splitRuleParts(value)
  const used = [...parts.keys()].filter((key) => !['FREQ', 'INTERVAL', 'UNTIL', 'COUNT', 'WKST'].includes(key))
  const frequency = rule.frequency.toLowerCase() as SimpleRecurrenceParts['frequency']
  const startWeekday = weekdayOf(start)
  const simple: SimpleRecurrenceParts = {
    frequency,
    interval: Math.min(rule.interval, 99),
    weekdays: [startWeekday],
    monthlyMode: 'dayOfMonth',
  }
  const subDaily = SUB_DAILY.includes(parts.get('FREQ') ?? '')
  let exact = !subDaily && rule.interval <= 99

  if (rule.frequency === 'DAILY') exact &&= used.length === 0
  else if (rule.frequency === 'WEEKLY') {
    const weekdays =
      rule.byDay.length > 0
        ? [...new Set(rule.byDay.map(({ weekday }) => weekday))].sort((a, b) => a - b)
        : [startWeekday]
    simple.weekdays = weekdays
    exact &&=
      used.every((key) => key === 'BYDAY') &&
      rule.byDay.every(({ ordinal }) => ordinal === null) &&
      weekdays.includes(startWeekday) &&
      (rule.interval === 1 || rule.weekStart === 0 || weekdays.length === 1)
  } else if (rule.frequency === 'MONTHLY') {
    const day = startDate.getUTCDate()
    if (used.length === 0) simple.monthlyMode = 'dayOfMonth'
    else if (used.length === 1 && rule.byMonthDay.length === 1 && rule.byMonthDay[0] === day)
      simple.monthlyMode = 'dayOfMonth'
    else if (used.length === 1 && rule.byDay.length === 1 && rule.byDay[0].weekday === startWeekday) {
      const ordinal = rule.byDay[0].ordinal
      if (ordinal === -1 && isInLastWeek(start)) simple.monthlyMode = 'lastWeekdayOfMonth'
      else if (ordinal !== null && ordinal > 0 && ordinal === ordinalInMonth(start))
        simple.monthlyMode = 'weekdayOfMonth'
      else exact = false
    } else exact = false
  } else {
    const month = startDate.getUTCMonth() + 1
    const day = startDate.getUTCDate()
    const monthMatches = rule.byMonth.length === 1 && rule.byMonth[0] === month
    exact &&=
      used.length === 0 ||
      (used.length === 1 && used[0] === 'BYMONTH' && monthMatches) ||
      (used.length === 2 &&
        used.includes('BYMONTH') &&
        used.includes('BYMONTHDAY') &&
        monthMatches &&
        rule.byMonthDay.length === 1 &&
        rule.byMonthDay[0] === day)
  }
  return { simple, exact }
}

export const ruleFromSimple = (
  { frequency, interval, weekdays, monthlyMode }: SimpleRecurrenceParts,
  seriesStart: string,
) => {
  const parts = [`FREQ=${frequency.toUpperCase()}`]
  if (interval > 1) parts.push(`INTERVAL=${interval}`)
  if (frequency === 'weekly') parts.push(`BYDAY=${weekdays.map((day) => WEEKDAY_CODES[day]).join(',')}`)
  if (frequency === 'monthly' && monthlyMode !== 'dayOfMonth') {
    const start = dayIndex(seriesStart)
    const ordinal = monthlyMode === 'lastWeekdayOfMonth' ? -1 : ordinalInMonth(start)
    parts.push(`BYDAY=${ordinal}${WEEKDAY_CODES[weekdayOf(start)]}`)
  }
  return parts.join(';')
}
