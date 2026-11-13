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
import { getISODateWeekday, getWeekdayOrdinal, type Recurrence } from './recurrence.ts'
import { convertWallTime, isTimeZone } from './timeZone.ts'

const LINE_LIMIT = 75
const ICAL_WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const FREQUENCIES: Record<string, Recurrence['frequency']> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}
const PARTSTATS: Record<AttendeeStatus, string> = {
  needsAction: 'NEEDS-ACTION',
  accepted: 'ACCEPTED',
  tentative: 'TENTATIVE',
  declined: 'DECLINED',
}
const UNTITLED = '–'
const DEFAULT_DURATION_MINUTES = 60

const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

const quoteParam = (name: string, value: string) => (value ? `;${name}="${value.replace(/"/g, "'")}"` : '')

const unescapeText = (value: string) =>
  value.replace(/\\([\\;,nN])/g, (_, char: string) => (char === 'n' || char === 'N' ? '\n' : char))

const foldLine = (line: string) => {
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

const utcStamp = (date: Date) =>
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
  return { params: event.timeZone ? `;TZID=${event.timeZone}` : '', value: compactDateTime(date, time) }
}

const toRRule = (event: CalendarEvent) => {
  const { recurrence } = event
  if (!recurrence) return null
  const parts = [`FREQ=${recurrence.frequency.toUpperCase()}`]
  if (recurrence.interval > 1) parts.push(`INTERVAL=${recurrence.interval}`)
  if (recurrence.frequency === 'weekly' && recurrence.weekdays.length > 0)
    parts.push(`BYDAY=${recurrence.weekdays.map((day) => ICAL_WEEKDAYS[day]).join(',')}`)
  if (recurrence.frequency === 'monthly' && recurrence.monthlyMode !== 'dayOfMonth') {
    const weekday = ICAL_WEEKDAYS[getISODateWeekday(event.startDate)]
    const ordinal = recurrence.monthlyMode === 'lastWeekdayOfMonth' ? -1 : getWeekdayOrdinal(event.startDate)
    parts.push(`BYDAY=${ordinal}${weekday}`)
  }
  if (recurrence.until)
    parts.push(`UNTIL=${event.allDay ? compactDate(recurrence.until) : compactDateTime(recurrence.until, '23:59')}`)
  if (recurrence.count) parts.push(`COUNT=${recurrence.count}`)
  return parts.join(';')
}

const toDuration = (minutes: number) => {
  if (minutes === 0) return 'PT0M'
  if (minutes % 1440 === 0) return `-P${minutes / 1440}D`
  return `-PT${minutes}M`
}

const eventLines = (event: CalendarEvent, series: CalendarEvent | undefined, stamp: string) => {
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
  event.links.forEach(({ url, label }, index) =>
    lines.push(`${index === 0 ? 'URL' : 'ATTACH'}${quoteParam('LABEL', label)}:${url}`),
  )
  const rrule = toRRule(event)
  if (rrule) lines.push(`RRULE:${rrule}`)
  for (const date of event.excludedDates) {
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

export function toICalendar(events: readonly CalendarEvent[], calendarName: string, now = new Date()) {
  const byId = new Map(events.map((event) => [event.id, event]))
  const stamp = utcStamp(now)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rokoyfa//Calendar//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...events.flatMap((event) => eventLines(event, event.seriesId ? byId.get(event.seriesId) : undefined, stamp)),
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

const parseRRule = (value: string, startDate: string): Recurrence | null => {
  const rule = Object.fromEntries(
    value.split(';').map((part) => {
      const [key, ruleValue = ''] = part.split('=')
      return [key.toUpperCase(), ruleValue.toUpperCase()]
    }),
  )
  const frequency = FREQUENCIES[rule.FREQ]
  if (!frequency) return null
  const interval = Math.min(Math.max(Number(rule.INTERVAL ?? 1) || 1, 1), 99)
  const byDay = rule.BYDAY ? rule.BYDAY.split(',') : []
  let weekdays: number[] = []
  let monthlyMode: Recurrence['monthlyMode'] = 'dayOfMonth'
  if (frequency === 'weekly') {
    weekdays = byDay.map((day) => ICAL_WEEKDAYS.indexOf(day.slice(-2))).filter((day) => day >= 0)
    if (weekdays.length === 0) weekdays = [getISODateWeekday(startDate)]
  } else if (frequency === 'monthly' && byDay.length === 1) {
    monthlyMode = byDay[0].startsWith('-1') ? 'lastWeekdayOfMonth' : 'weekdayOfMonth'
  } else if (byDay.length > 0) return null
  const until = rule.UNTIL ? `${rule.UNTIL.slice(0, 4)}-${rule.UNTIL.slice(4, 6)}-${rule.UNTIL.slice(6, 8)}` : null
  const count = rule.COUNT ? Math.min(Math.max(Number(rule.COUNT) || 1, 1), 999) : null
  return {
    frequency,
    interval,
    weekdays: [...new Set(weekdays)].sort((a, b) => a - b),
    monthlyMode,
    until: until && isISODate(until) && until >= startDate && count === null ? until : null,
    count,
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

export type ImportedEvent = { input: EventInput; recurrenceId: string | null }

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
  const recurrence = rrule ? parseRRule(rrule.value, start.date) : null
  const recurrenceIdProperty = get('RECURRENCE-ID')
  const recurrenceId = recurrenceIdProperty ? (parseTime(recurrenceIdProperty)?.date ?? null) : null
  const excludedDates = recurrence
    ? [
        ...new Set(
          all('EXDATE').flatMap((property) =>
            property.value
              .split(',')
              .map((value) => parseTime({ ...property, value })?.date)
              .filter((date): date is string => date !== undefined),
          ),
        ),
      ].sort()
    : []
  const text = (name: string, max: number) =>
    unescapeText(get(name)?.value ?? '')
      .trim()
      .slice(0, max)
  const reminders = component.children
    .filter((child) => child.name === 'VALARM')
    .map(parseReminder)
    .filter((minutes): minutes is number => minutes !== null)

  return {
    recurrenceId: recurrence ? null : recurrenceId,
    input: {
      uid: get('UID')?.value.trim() || createEventUid(),
      title: text('SUMMARY', EVENT_TITLE_MAX_LENGTH) || UNTITLED,
      location: text('LOCATION', EVENT_LOCATION_MAX_LENGTH),
      categoryIds: [],
      links: [...all('URL'), ...all('ATTACH')]
        .map(parseLink)
        .filter((link): link is EventLink => link !== null)
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
      attendees: all('ATTENDEE')
        .map(parseAttendee)
        .filter((attendee): attendee is Attendee => attendee !== null),
    },
  }
}

export type ICalendarImport = { events: ImportedEvent[]; skipped: number }

export function parseICalendar(text: string): ICalendarImport | null {
  const calendar = parseComponents(text).children.find((component) => component.name === 'VCALENDAR')
  if (!calendar) return null
  const components = calendar.children.filter((component) => component.name === 'VEVENT')
  const events = components.map(toImportedEvent).filter((event): event is ImportedEvent => event !== null)
  return { events, skipped: components.length - events.length }
}
