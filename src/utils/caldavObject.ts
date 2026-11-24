import { caldavCalendarId, caldavEventId, type CaldavCalendar, type CaldavObject } from './caldav.ts'
import { isEventColor, newEventMeta, type CalendarEvent, type EventColor } from './event.ts'
import { eventLines, foldLine, overrideDatesOf, parseICalendar, utcStamp } from './ical.ts'
import { convertWallTime, isTimeZone } from './timeZone.ts'
import { vtimezoneLines } from './vtimezone.ts'

type RawProperty = { kind: 'property'; name: string; line: string }

type RawComponent = { kind: 'component'; name: string; items: RawItem[] }

type RawItem = RawProperty | RawComponent

const nameOf = (line: string) => (/^[^;:]+/.exec(line)?.[0] ?? '').toUpperCase()

const parseRaw = (data: string): RawComponent => {
  const root: RawComponent = { kind: 'component', name: 'ROOT', items: [] }
  const stack = [root]
  for (const line of data.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)) {
    if (line.trim() === '') continue
    const name = nameOf(line)
    const current = stack[stack.length - 1]
    if (name === 'BEGIN') {
      const component: RawComponent = { kind: 'component', name: line.slice(6).trim().toUpperCase(), items: [] }
      current.items.push(component)
      stack.push(component)
    } else if (name === 'END') {
      if (stack.length > 1) stack.pop()
    } else current.items.push({ kind: 'property', name, line })
  }
  return root
}

const serializeRaw = (component: RawComponent): string[] => [
  `BEGIN:${component.name}`,
  ...component.items.flatMap((item) => (item.kind === 'property' ? [item.line] : serializeRaw(item))),
  `END:${component.name}`,
]

const toRawComponent = (lines: readonly string[]) => parseRaw(lines.join('\r\n')).items[0] as RawComponent

const components = (component: RawComponent, name: string) =>
  component.items.filter((item): item is RawComponent => item.kind === 'component' && item.name === name)

const properties = (component: RawComponent, name: string) =>
  component.items.filter((item): item is RawProperty => item.kind === 'property' && item.name === name)

type ParsedLine = { name: string; params: [string, string][]; value: string }

const parseLine = (line: string): ParsedLine => {
  const params: [string, string][] = []
  let index = nameOf(line).length
  while (line[index] === ';') {
    const equals = line.indexOf('=', index)
    if (equals === -1) break
    const key = line.slice(index + 1, equals)
    let cursor = equals + 1
    let value = ''
    while (cursor < line.length && line[cursor] !== ';' && line[cursor] !== ':') {
      if (line[cursor] === '"') {
        const close = line.indexOf('"', cursor + 1)
        const end = close === -1 ? line.length : close + 1
        value += line.slice(cursor, end)
        cursor = end
      } else value += line[cursor++]
    }
    params.push([key, value])
    index = cursor
  }
  return { name: line.slice(0, nameOf(line).length), params, value: line.slice(index + 1) }
}

const formatLine = ({ name, params, value }: ParsedLine) =>
  `${name}${params.map(([key, paramValue]) => `;${key}=${paramValue}`).join('')}:${value}`

const paramOf = (line: ParsedLine, key: string) =>
  line.params.find(([name]) => name.toUpperCase() === key)?.[1].replace(/^"|"$/g, '')

const DATE_TIME = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})\d{0,2}(Z)?)?$/

const recurrenceKey = (event: RawComponent, master: RawComponent | undefined) => {
  const property = properties(event, 'RECURRENCE-ID')[0]
  if (!property) return null
  const line = parseLine(property.line)
  const match = DATE_TIME.exec(line.value.trim())
  if (!match) return null
  const date = `${match[1]}-${match[2]}-${match[3]}`
  if (match[4] === undefined || !master) return date
  const from = match[6] ? 'UTC' : paramOf(line, 'TZID')
  const startLine = properties(master, 'DTSTART')[0]
  const to = startLine ? paramOf(parseLine(startLine.line), 'TZID') : undefined
  const startZone = startLine && /Z$/.test(parseLine(startLine.line).value.trim()) ? 'UTC' : to
  if (!from || !startZone || from === startZone || !isTimeZone(from) || !isTimeZone(startZone)) return date
  return convertWallTime({ date, time: `${match[4]}:${match[5]}` }, from, startZone).date
}

const singleCalendar = (data: string) => components(parseRaw(data), 'VCALENDAR')[0] ?? null

const wrap = (event: RawComponent) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', ...serializeRaw(event), 'END:VCALENDAR'].join('\r\n')

const colorOf = (event: RawComponent): EventColor | null => {
  const value = properties(event, 'COLOR')[0]
    ? parseLine(properties(event, 'COLOR')[0].line).value.trim().toLowerCase()
    : ''
  return isEventColor(value) ? value : null
}

export const toCaldavEvents = (calendar: CaldavCalendar, object: CaldavObject): CalendarEvent[] => {
  const vcalendar = singleCalendar(object.data)
  if (!vcalendar) return []
  const vevents = components(vcalendar, 'VEVENT')
  const master = vevents.find((event) => properties(event, 'RECURRENCE-ID').length === 0)
  const base = {
    calendarId: caldavCalendarId(calendar.id),
    categoryIds: [],
    ...newEventMeta(),
  }
  const toEvent = (component: RawComponent, originalDate: string | null): CalendarEvent | null => {
    const parsed = parseICalendar(wrap(component))?.events[0]
    if (!parsed) return null
    return {
      ...parsed.input,
      ...base,
      id: caldavEventId(calendar.id, object.id, originalDate),
      color: colorOf(component) ?? calendar.color,
      seriesId: null,
      originalDate: null,
    }
  }
  const root = toEvent(master ?? vevents[0], null)
  if (!root) return []
  if (!master || !root.recurrence) return [{ ...root, recurrence: null, excludedDates: [] }]
  const overrides = vevents.flatMap((component) => {
    if (component === master) return []
    const originalDate = recurrenceKey(component, master)
    const event = originalDate ? toEvent(component, originalDate) : null
    return event && originalDate
      ? [{ ...event, uid: root.uid, recurrence: null, excludedDates: [], seriesId: root.id, originalDate }]
      : []
  })
  const excludedDates = [...new Set([...root.excludedDates, ...overrides.map((event) => event.originalDate!)])].sort()
  return [{ ...root, excludedDates }, ...overrides]
}

const MANAGED = new Set([
  'DTSTAMP',
  'DTSTART',
  'DTEND',
  'DURATION',
  'SUMMARY',
  'LOCATION',
  'DESCRIPTION',
  'URL',
  'RRULE',
  'EXDATE',
  'RDATE',
  'LAST-MODIFIED',
  'ATTENDEE',
  'SEQUENCE',
])

const isWebAttachment = (line: string) => {
  const parsed = parseLine(line)
  return (
    !paramOf(parsed, 'ENCODING') &&
    paramOf(parsed, 'VALUE')?.toUpperCase() !== 'BINARY' &&
    /^https?:\/\//i.test(parsed.value.trim())
  )
}

const isReadableAlarm = (alarm: RawComponent) => {
  const trigger = properties(alarm, 'TRIGGER')[0]
  if (!trigger) return false
  const line = parseLine(trigger.line)
  return (
    paramOf(line, 'VALUE')?.toUpperCase() !== 'DATE-TIME' &&
    paramOf(line, 'RELATED')?.toUpperCase() !== 'END' &&
    /^-?P/.test(line.value.trim())
  )
}

const emailOf = (line: string) =>
  parseLine(line)
    .value.trim()
    .replace(/^mailto:/i, '')
    .toLowerCase()

const mergeAttendee = (generated: string, original: string | undefined) => {
  if (!original) return generated
  const fresh = parseLine(generated)
  const kept = parseLine(original)
  const freshValue = (key: string) => fresh.params.find(([name]) => name.toUpperCase() === key)?.[1]
  const params = kept.params
    .filter(([key]) => key.toUpperCase() !== 'CN' || freshValue('CN') !== undefined)
    .map(([key, value]): [string, string] =>
      key.toUpperCase() === 'PARTSTAT' || key.toUpperCase() === 'CN'
        ? [key, freshValue(key.toUpperCase()) ?? value]
        : [key, value],
    )
  for (const key of ['CN', 'PARTSTAT']) {
    const value = freshValue(key)
    if (value !== undefined && !params.some(([name]) => name.toUpperCase() === key)) params.push([key, value])
  }
  return formatLine({ ...kept, params })
}

const colorLine = (color: EventColor): RawProperty => ({ kind: 'property', name: 'COLOR', line: `COLOR:${color}` })

const withProperties = (component: RawComponent, extra: readonly RawProperty[]): RawComponent => ({
  ...component,
  items: [
    ...component.items.filter((item) => item.kind === 'property'),
    ...extra,
    ...component.items.filter((item) => item.kind === 'component'),
  ],
})

const mergeEvent = (original: RawComponent, generated: RawComponent, stamp: string, color: EventColor | null) => {
  const originalAttendees = new Map(properties(original, 'ATTENDEE').map(({ line }) => [emailOf(line), line]))
  const kept = original.items.filter((item) => {
    if (item.kind === 'component') return item.name !== 'VALARM' || !isReadableAlarm(item)
    if (item.name === 'ATTACH') return !isWebAttachment(item.line)
    if (item.name === 'COLOR') return color === null
    return !MANAGED.has(item.name)
  })
  const fresh = generated.items.flatMap((item): RawItem[] => {
    if (item.kind === 'component') return [item]
    if (item.name === 'UID' || item.name === 'RECURRENCE-ID') return []
    if (item.name === 'ATTENDEE')
      return [{ ...item, line: mergeAttendee(item.line, originalAttendees.get(emailOf(item.line))) }]
    return [item]
  })
  const extra: RawProperty[] = [{ kind: 'property', name: 'LAST-MODIFIED', line: `LAST-MODIFIED:${stamp}` }]
  const sequence = properties(original, 'SEQUENCE')[0]
  if (sequence) {
    const value = Number(parseLine(sequence.line).value.trim())
    extra.push({ kind: 'property', name: 'SEQUENCE', line: `SEQUENCE:${Number.isInteger(value) ? value + 1 : 1}` })
  }
  if (color) extra.push(colorLine(color))
  return withProperties({ ...original, items: [...kept, ...fresh] }, extra)
}

const usedTimeZones = (vcalendar: RawComponent, events: readonly CalendarEvent[]) => {
  const present = new Set(
    components(vcalendar, 'VTIMEZONE').flatMap((zone) =>
      properties(zone, 'TZID').map(({ line }) => parseLine(line).value.trim()),
    ),
  )
  const needed = new Map<string, number>()
  for (const event of events)
    if (
      !event.allDay &&
      event.timeZone &&
      event.timeZone !== 'UTC' &&
      !present.has(event.timeZone) &&
      !needed.has(event.timeZone)
    )
      needed.set(event.timeZone, Number(event.startDate.slice(0, 4)))
  return [...needed].map(([timeZone, year]) => toRawComponent(vtimezoneLines(timeZone, year)))
}

export const buildCaldavObject = (
  original: string | null,
  events: readonly CalendarEvent[],
  calendarColor: EventColor,
  now = new Date(),
) => {
  const stamp = utcStamp(now)
  const master = events.find((event) => event.seriesId === null)
  if (!master) throw new Error('The object needs a main event.')
  const overrides = master.recurrence ? events.filter((event) => event.seriesId === master.id) : []
  const overrideDates = overrideDatesOf([master, ...overrides]).get(master.id)
  const generate = (event: CalendarEvent) =>
    toRawComponent(
      eventLines(
        event,
        event === master ? undefined : master,
        stamp,
        new Map(),
        event === master ? overrideDates : undefined,
      ),
    )
  const parsed = original ? singleCalendar(original) : null
  const vcalendar =
    parsed ??
    toRawComponent([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Rokoyfa//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'END:VCALENDAR',
    ])
  const originalEvents = components(vcalendar, 'VEVENT')
  const originalMaster =
    originalEvents.find((event) => properties(event, 'RECURRENCE-ID').length === 0) ?? originalEvents[0]
  const byKey = new Map(
    originalEvents
      .filter((event) => event !== originalMaster)
      .map((event) => [recurrenceKey(event, originalMaster), event]),
  )
  const merged = [master, ...overrides].map((event) => {
    const generated = generate(event)
    const previous = event === master ? originalMaster : byKey.get(event.originalDate)
    const previousColor = previous ? (colorOf(previous) ?? calendarColor) : calendarColor
    const color = event.color === previousColor ? null : event.color
    if (!previous) return color ? withProperties(generated, [colorLine(color)]) : generated
    return mergeEvent(previous, generated, stamp, color)
  })
  const others = vcalendar.items.filter((item) => !(item.kind === 'component' && item.name === 'VEVENT'))
  const result: RawComponent = {
    ...vcalendar,
    items: [...others, ...usedTimeZones(vcalendar, [master, ...overrides]), ...merged],
  }
  return `${serializeRaw(result).map(foldLine).join('\r\n')}\r\n`
}
