import { CATEGORY_NAME_MAX_LENGTH, normalizeCategoryName } from './category.ts'
import { addDaysToISODate, isISODate, timeToMinutes } from './date.ts'
import {
  ATTENDEE_STATUSES,
  createEventUid,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LINK_LABEL_MAX_LENGTH,
  EVENT_LINK_URL_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  isWebUrl,
  MAX_EVENT_LINKS,
  MAX_REMINDER_MINUTES,
  NO_SERIES_LINK,
  type Attendee,
  type AttendeeStatus,
  type CalendarEvent,
  type EventInput,
  type EventLink,
} from './event.ts'
import {
  createRecurrence,
  getISODateWeekday,
  getWeekdayOrdinal,
  RECURRENCE_COUNT_MAX,
  type Recurrence,
} from './recurrence.ts'
import { isRule, normalizeRule, RECURRENCE_DATES_MAX, splitRuleParts, toSimpleRecurrence } from './rrule.ts'
import { convertWallTime, isTimeZone, toInstant } from './timeZone.ts'
import { timeZonesOf, vtimezoneLines } from './vtimezone.ts'
import { isPresent } from './parse.ts'

const LINE_LIMIT = 75
const ICAL_WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const PARTSTATS: Record<AttendeeStatus, string> = {
  needsAction: 'NEEDS-ACTION',
  accepted: 'ACCEPTED',
  tentative: 'TENTATIVE',
  declined: 'DECLINED',
}
const UNTITLED = '–'
const DEFAULT_DURATION_MINUTES = 60

export const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

const quoteParam = (name: string, value: string) => (value ? `;${name}="${value.replace(/"/g, "'")}"` : '')

const splitTextList = (value: string) => {
  const items: string[] = []
  let current = ''
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char === '\\' && index + 1 < value.length) {
      current += char + value[index + 1]
      index += 1
    } else if (char === ',') {
      items.push(current)
      current = ''
    } else current += char
  }
  items.push(current)
  return items
}

const unescapeText = (value: string) =>
  value.replace(/\\([\\;,nN])/g, (_, char: string) => (char === 'n' || char === 'N' ? '\n' : char))

export const foldLine = (line: string) => {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  for (const char of line) {
    const limit = parts.length === 0 ? LINE_LIMIT : LINE_LIMIT - 1
    if (encoder.encode(current + char).length > limit) {
      parts.push(current)
      current = char
    } else current += char
  }
  parts.push(current)
  return parts.join('\r\n ')
}

const compactDate = (isoDate: string) => isoDate.replaceAll('-', '')

const compactDateTime = (isoDate: string, time: string) => `${compactDate(isoDate)}T${time.replace(':', '')}00`

export const utcStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

type TimeProperty = { params: string; value: string }

const toTimeProperty = (
  event: Pick<CalendarEvent, 'allDay' | 'timeZone'>,
  date: string,
  time: string,
): TimeProperty => {
  if (event.allDay) return { params: ';VALUE=DATE', value: compactDate(date) }
  if (event.timeZone === 'UTC') return { params: '', value: `${compactDateTime(date, time)}Z` }
  return { params: event.timeZone ? `;TZID=${event.timeZone}` : '', value: compactDateTime(date, time) }
}

const toUntil = (event: CalendarEvent, until: string) => {
  if (event.allDay) return compactDate(until)
  if (!event.timeZone) return compactDateTime(until, '23:59')
  return utcStamp(new Date(toInstant({ date: until, time: '23:59' }, event.timeZone)))
}

const toRRule = (event: CalendarEvent) => {
  const { recurrence } = event
  if (!recurrence) return null
  if (recurrence.rule !== null) {
    const end = recurrence.until
      ? `;UNTIL=${toUntil(event, recurrence.until)}`
      : recurrence.count
        ? `;COUNT=${recurrence.count}`
        : ''
    return `${recurrence.rule}${end}`
  }
  const parts = [`FREQ=${recurrence.frequency.toUpperCase()}`]
  if (recurrence.interval > 1) parts.push(`INTERVAL=${recurrence.interval}`)
  if (recurrence.frequency === 'weekly' && recurrence.weekdays.length > 0)
    parts.push(`BYDAY=${recurrence.weekdays.map((day) => ICAL_WEEKDAYS[day]).join(',')}`)
  if (recurrence.frequency === 'monthly' && recurrence.monthlyMode !== 'dayOfMonth') {
    const weekday = ICAL_WEEKDAYS[getISODateWeekday(event.startDate)]
    const ordinal = recurrence.monthlyMode === 'lastWeekdayOfMonth' ? -1 : getWeekdayOrdinal(event.startDate)
    parts.push(`BYDAY=${ordinal}${weekday}`)
  }
  if (recurrence.until) parts.push(`UNTIL=${toUntil(event, recurrence.until)}`)
  if (recurrence.count) parts.push(`COUNT=${recurrence.count}`)
  return parts.join(';')
}

const toDuration = (minutes: number) => {
  if (minutes === 0) return 'PT0M'
  if (minutes % 1440 === 0) return `-P${minutes / 1440}D`
  return `-PT${minutes}M`
}

export const eventLines = (
  event: CalendarEvent,
  series: CalendarEvent | undefined,
  stamp: string,
  categoryNames: ReadonlyMap<string, string>,
  overrideDates: ReadonlySet<string> = new Set(),
) => {
  const start = toTimeProperty(event, event.startDate, event.start)
  const end = toTimeProperty(event, event.allDay ? addDaysToISODate(event.endDate, 1) : event.endDate, event.end)
  const lines = [
    'BEGIN:VEVENT',
    `UID:${series?.uid ?? event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART${start.params}:${start.value}`,
    `DTEND${end.params}:${end.value}`,
    `SUMMARY:${escapeText(event.title)}`,
  ]
  if (series && event.originalDate) {
    const original = toTimeProperty(series, event.originalDate, series.start)
    lines.push(`RECURRENCE-ID${original.params}:${original.value}`)
  }
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  const categories = event.categoryIds.flatMap((id) => categoryNames.get(id) ?? [])
  if (categories.length > 0) lines.push(`CATEGORIES:${categories.map(escapeText).join(',')}`)
  event.links.forEach(({ url, label }, index) =>
    lines.push(`${index === 0 ? 'URL' : 'ATTACH'}${quoteParam('LABEL', label)}:${url}`),
  )
  const rrule = toRRule(event)
  if (rrule) lines.push(`RRULE:${rrule}`)
  for (const date of event.recurrence?.dates ?? []) {
    const extra = toTimeProperty(event, date, event.start)
    lines.push(`RDATE${extra.params}:${extra.value}`)
  }
  for (const date of event.excludedDates) {
    if (overrideDates.has(date)) continue
    const excluded = toTimeProperty(event, date, event.start)
    lines.push(`EXDATE${excluded.params}:${excluded.value}`)
  }
  for (const attendee of event.attendees) {
    lines.push(
      `ATTENDEE${quoteParam('CN', attendee.name)};PARTSTAT=${PARTSTATS[attendee.status]}:mailto:${attendee.email}`,
    )
  }
  for (const minutes of event.reminders)
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(event.title)}`,
      `TRIGGER:${toDuration(minutes)}`,
      'END:VALARM',
    )
  lines.push('END:VEVENT')
  return lines
}

export const overrideDatesOf = (events: readonly CalendarEvent[]) => {
  const dates = new Map<string, Set<string>>()
  for (const { seriesId, originalDate } of events)
    if (seriesId && originalDate) dates.set(seriesId, (dates.get(seriesId) ?? new Set()).add(originalDate))
  return dates
}

export type ICalendarExportOptions = {
  now?: Date
  categoryNames?: ReadonlyMap<string, string>
}

const NO_CATEGORY_NAMES: ReadonlyMap<string, string> = new Map()

export function toICalendar(
  events: readonly CalendarEvent[],
  calendarName: string,
  { now = new Date(), categoryNames = NO_CATEGORY_NAMES }: ICalendarExportOptions = {},
) {
  const byId = new Map(events.map((event) => [event.id, event]))
  const overrides = overrideDatesOf(events)
  const stamp = utcStamp(now)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rokoyfa//Calendar//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...[...timeZonesOf(events)].flatMap(([timeZone, year]) => vtimezoneLines(timeZone, year)),
    ...events.flatMap((event) =>
      eventLines(
        event,
        event.seriesId ? byId.get(event.seriesId) : undefined,
        stamp,
        categoryNames,
        overrides.get(event.id),
      ),
    ),
    'END:VCALENDAR',
  ]
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

type Property = { name: string; params: Record<string, string>; value: string }

const PROPERTY_HEAD = /^([^:;]+)((?:;[^=;:]+=(?:"[^"]*"|[^";:]*))*):(.*)$/
const PARAM = /;([^=;:]+)=("[^"]*"|[^";:]*)/g

const parseProperty = (line: string): Property | null => {
  const match = PROPERTY_HEAD.exec(line)
  if (!match) return null
  const params: Record<string, string> = {}
  for (const [, name, value] of match[2].matchAll(PARAM)) params[name.toUpperCase()] = value.replace(/^"|"$/g, '')
  return { name: match[1].toUpperCase(), params, value: match[3] }
}

type Component = { name: string; properties: Property[]; children: Component[] }

const parseComponents = (text: string) => {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const root: Component = { name: 'ROOT', properties: [], children: [] }
  const stack = [root]
  for (const line of lines) {
    if (line.trim() === '') continue
    const property = parseProperty(line)
    if (!property) continue
    const current = stack[stack.length - 1]
    if (property.name === 'BEGIN') {
      const child: Component = { name: property.value.toUpperCase(), properties: [], children: [] }
      current.children.push(child)
      stack.push(child)
    } else if (property.name === 'END') {
      if (stack.length > 1) stack.pop()
    } else current.properties.push(property)
  }
  return root
}

type ParsedTime = { date: string; time: string; allDay: boolean; timeZone: string | null }

const parseTime = ({ params, value }: Property): ParsedTime | null => {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim())
  if (!match) return null
  const date = `${match[1]}-${match[2]}-${match[3]}`
  if (!isISODate(date)) return null
  if (params.VALUE === 'DATE' || match[4] === undefined) return { date, time: '00:00', allDay: true, timeZone: null }
  const time = `${match[4]}:${match[5]}`
  if (match[7]) return { date, time, allDay: false, timeZone: 'UTC' }
  const timeZone = params.TZID && isTimeZone(params.TZID) ? params.TZID : null
  return { date, time, allDay: false, timeZone }
}

const parseDurationMinutes = (value: string) => {
  const match = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value.trim())
  if (!match) return null
  const [, sign, weeks, days, hours, minutes] = match
  const total = Number(weeks ?? 0) * 10080 + Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0)
  return sign === '-' ? -total : total
}

const addMinutes = ({ date, time }: { date: string; time: string }, minutes: number) => {
  const total = timeToMinutes(time) + minutes
  const days = Math.floor(total / 1440)
  const rest = total - days * 1440
  return {
    date: addDaysToISODate(date, days),
    time: `${String(Math.floor(rest / 60)).padStart(2, '0')}:${String(rest % 60).padStart(2, '0')}`,
  }
}

const inStartZone = (value: ParsedTime, start: ParsedTime) =>
  value.allDay || start.allDay || !value.timeZone || !start.timeZone || value.timeZone === start.timeZone
    ? value
    : { ...value, ...convertWallTime(value, value.timeZone, start.timeZone), timeZone: start.timeZone }

const untilDate = (value: string, start: ParsedTime) => {
  const parsed = parseTime({ name: 'UNTIL', params: {}, value })
  if (!parsed) return null
  if (parsed.allDay || start.allDay) return parsed.date
  const local = inStartZone(parsed.timeZone === 'UTC' ? parsed : { ...parsed, timeZone: start.timeZone }, start)
  return local.time < start.time ? addDaysToISODate(local.date, -1) : local.date
}

const occurrenceDates = (properties: readonly Property[], start: ParsedTime) => [
  ...new Set(
    properties.flatMap((property) =>
      property.params.VALUE === 'PERIOD'
        ? []
        : property.value.split(',').flatMap((value) => {
            const parsed = parseTime({ ...property, value })
            return parsed ? [inStartZone(parsed, start).date] : []
          }),
    ),
  ),
]

const parseRRule = (value: string, start: ParsedTime): Recurrence | null => {
  const normalized = normalizeRule(value)
  const result = toSimpleRecurrence(normalized, start.date)
  if (!result) return null
  const parts = splitRuleParts(value)
  const untilValue = parts.get('UNTIL')
  const countValue = parts.get('COUNT')
  const count = countValue ? Math.min(Math.max(Number(countValue) || 1, 1), RECURRENCE_COUNT_MAX) : null
  const until = untilValue && count === null ? untilDate(untilValue, start) : null
  return {
    ...result.simple,
    until: until && isISODate(until) && until >= start.date ? until : null,
    count,
    rule: result.exact || !isRule(normalized) ? null : normalized,
    dates: [],
  }
}

const PARTSTAT_TO_STATUS = Object.fromEntries(
  Object.entries(PARTSTATS).map(([status, partstat]) => [partstat, status]),
) as Record<string, AttendeeStatus>

const parseAttendee = ({ params, value }: Property): Attendee | null => {
  const email = value
    .replace(/^mailto:/i, '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) return null
  const status = PARTSTAT_TO_STATUS[params.PARTSTAT?.toUpperCase() ?? '']
  return { email, name: params.CN ?? '', status: ATTENDEE_STATUSES.includes(status) ? status : 'needsAction' }
}

const parseLink = ({ params, value }: Property): EventLink | null => {
  const url = value.trim()
  if (params.VALUE === 'BINARY' || params.ENCODING || url.length > EVENT_LINK_URL_MAX_LENGTH || !isWebUrl(url))
    return null
  return { url, label: (params.LABEL ?? '').trim().slice(0, EVENT_LINK_LABEL_MAX_LENGTH) }
}

const parseReminder = (alarm: Component) => {
  const trigger = alarm.properties.find((property) => property.name === 'TRIGGER')
  if (!trigger || trigger.params.VALUE === 'DATE-TIME' || trigger.params.RELATED === 'END') return null
  const minutes = parseDurationMinutes(trigger.value)
  return minutes !== null && minutes <= 0 && -minutes <= MAX_REMINDER_MINUTES ? -minutes : null
}

export type ImportedEvent = { input: EventInput; recurrenceId: string | null; categoryNames: string[] }

const toImportedEvent = (component: Component): ImportedEvent | null => {
  const get = (name: string) => component.properties.find((property) => property.name === name)
  const all = (name: string) => component.properties.filter((property) => property.name === name)
  const startProperty = get('DTSTART')
  const start = startProperty && parseTime(startProperty)
  if (!start) return null

  const endProperty = get('DTEND')
  const durationProperty = get('DURATION')
  const parsedEnd = endProperty ? parseTime(endProperty) : null
  const durationMinutes = durationProperty ? parseDurationMinutes(durationProperty.value) : null
  let end: { date: string; time: string }
  if (start.allDay) {
    const exclusiveEnd = parsedEnd?.date ?? addDaysToISODate(start.date, Math.max((durationMinutes ?? 1440) / 1440, 1))
    end = { date: exclusiveEnd > start.date ? addDaysToISODate(exclusiveEnd, -1) : start.date, time: '00:00' }
  } else if (parsedEnd) {
    end =
      parsedEnd.timeZone === start.timeZone || !parsedEnd.timeZone || !start.timeZone
        ? parsedEnd
        : convertWallTime(parsedEnd, parsedEnd.timeZone, start.timeZone)
  } else end = addMinutes(start, durationMinutes && durationMinutes > 0 ? durationMinutes : DEFAULT_DURATION_MINUTES)
  if (!start.allDay && `${end.date}T${end.time}` <= `${start.date}T${start.time}`)
    end = addMinutes(start, DEFAULT_DURATION_MINUTES)

  const rrule = get('RRULE')
  const extraDates = occurrenceDates(all('RDATE'), start)
    .filter((date) => date > start.date)
    .sort()
    .slice(0, RECURRENCE_DATES_MAX)
  const parsedRule = rrule ? parseRRule(rrule.value, start) : null
  const recurrence: Recurrence | null = parsedRule
    ? { ...parsedRule, dates: extraDates }
    : extraDates.length > 0
      ? { ...createRecurrence('daily', start.date), count: 1, dates: extraDates }
      : null
  const recurrenceIdProperty = get('RECURRENCE-ID')
  const recurrenceIdTime = recurrenceIdProperty ? parseTime(recurrenceIdProperty) : null
  const recurrenceId = recurrenceIdTime?.date ?? null
  const excludedDates = recurrence ? occurrenceDates(all('EXDATE'), start).sort() : []
  const text = (name: string, max: number) =>
    unescapeText(get(name)?.value ?? '')
      .trim()
      .slice(0, max)
  const reminders = component.children
    .filter((child) => child.name === 'VALARM')
    .map(parseReminder)
    .filter(isPresent)

  const categoryNames = all('CATEGORIES')
    .flatMap((property) => splitTextList(property.value))
    .map((name) => normalizeCategoryName(unescapeText(name)).slice(0, CATEGORY_NAME_MAX_LENGTH))
    .filter((name) => name !== '')
    .filter(
      (name, index, names) =>
        names.findIndex((other) => other.toLocaleLowerCase() === name.toLocaleLowerCase()) === index,
    )

  return {
    recurrenceId: recurrence ? null : recurrenceId,
    categoryNames,
    input: {
      uid: get('UID')?.value.trim() || createEventUid(),
      title: text('SUMMARY', EVENT_TITLE_MAX_LENGTH) || UNTITLED,
      location: text('LOCATION', EVENT_LOCATION_MAX_LENGTH),
      categoryIds: [],
      links: [...all('URL'), ...all('ATTACH')]
        .map(parseLink)
        .filter(isPresent)
        .filter((link, index, links) => links.findIndex(({ url }) => url === link.url) === index)
        .slice(0, MAX_EVENT_LINKS),
      startDate: start.date,
      start: start.time,
      endDate: end.date,
      end: start.allDay ? '00:00' : end.time,
      allDay: start.allDay,
      timeZone: start.timeZone,
      description: text('DESCRIPTION', EVENT_DESCRIPTION_MAX_LENGTH),
      color: 'blue',
      recurrence,
      excludedDates,
      ...NO_SERIES_LINK,
      reminders: [...new Set(reminders)].sort((a, b) => a - b),
      attendees: all('ATTENDEE').map(parseAttendee).filter(isPresent),
    },
  }
}

export type ICalendarImport = { events: ImportedEvent[]; skipped: number }

export function parseICalendar(text: string): ICalendarImport | null {
  const calendar = parseComponents(text).children.find((component) => component.name === 'VCALENDAR')
  if (!calendar) return null
  const components = calendar.children.filter((component) => component.name === 'VEVENT')
  const events = components.map(toImportedEvent).filter(isPresent)
  return { events, skipped: components.length - events.length }
}
