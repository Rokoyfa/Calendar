import type { CSSProperties } from 'react'
import {
  addDaysToISODate,
  daysBetween,
  isISODate,
  isTime,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  minutesToTime,
  timeToMinutes,
} from './date.ts'
import type { I18n, Messages } from '../i18n/index.ts'
import { classNames, type ClassNameValue } from './classNames.ts'
import { getReadableTextColor, isHexColor, type HexColor } from './color.ts'
import { isOneOf, pick } from './object.ts'
import { convertWallTime, isTimeZone } from './timeZone.ts'
import { hasFieldErrors } from './validation.ts'
import {
  getOccurrenceDates,
  hasRecurrenceErrors,
  parseRecurrence,
  validateRecurrence,
  type Recurrence,
  type RecurrenceValidationErrors,
} from './recurrence.ts'

export const PRESET_EVENT_COLORS = ['blue', 'red', 'green', 'yellow'] as const

export type PresetEventColor = (typeof PRESET_EVENT_COLORS)[number]

export type EventColor = PresetEventColor | HexColor

export const EVENT_TITLE_MAX_LENGTH = 100
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000
export const EVENT_LOCATION_MAX_LENGTH = 200
export const MAX_REMINDERS = 5
export const MAX_REMINDER_MINUTES = 4 * 7 * MINUTES_PER_DAY
export const MAX_ATTENDEES = 100
export const MAX_EVENT_LINKS = 10
export const ZONE_SHIFT_DAYS = 2
export const EVENT_LINK_URL_MAX_LENGTH = 2000
export const EVENT_LINK_LABEL_MAX_LENGTH = 100

export const ATTENDEE_STATUSES = ['needsAction', 'accepted', 'tentative', 'declined'] as const

export type AttendeeStatus = (typeof ATTENDEE_STATUSES)[number]

export type Attendee = { email: string; name: string; status: AttendeeStatus }

export type EventLink = { url: string; label: string }

export type CalendarEvent = {
  id: string
  calendarId: string
  uid: string
  title: string
  location: string
  links: EventLink[]
  startDate: string
  start: string
  endDate: string
  end: string
  allDay: boolean
  timeZone: string | null
  description: string
  color: EventColor
  recurrence: Recurrence | null
  excludedDates: string[]
  seriesId: string | null
  originalDate: string | null
  reminders: number[]
  attendees: Attendee[]
  createdAt: string
  updatedAt: string
}

const EVENT_INPUT_KEYS = [
  'uid',
  'title',
  'location',
  'links',
  'startDate',
  'start',
  'endDate',
  'end',
  'allDay',
  'timeZone',
  'description',
  'color',
  'recurrence',
  'excludedDates',
  'seriesId',
  'originalDate',
  'reminders',
  'attendees',
] as const satisfies readonly (keyof CalendarEvent)[]

export type EventInput = Pick<CalendarEvent, (typeof EVENT_INPUT_KEYS)[number]>

export const NO_SERIES_LINK = { seriesId: null, originalDate: null } as const satisfies Partial<EventInput>

export type EventPeriod = Pick<CalendarEvent, 'startDate' | 'start' | 'endDate' | 'end'>

export type EventOccurrence = CalendarEvent & {
  occurrenceKey: string
  occurrenceDate: string
  seriesStartDate: string
  source: EventPeriod
}

export type EditScope = 'single' | 'following' | 'all'

export type SeriesRule = Pick<CalendarEvent, 'startDate' | 'recurrence' | 'excludedDates'>

export type EventValidationErrors = Partial<Record<Exclude<keyof EventInput, 'recurrence'>, string>> & {
  recurrence?: RecurrenceValidationErrors
}

const isPresetEventColor = (value: unknown): value is PresetEventColor => isOneOf(PRESET_EVENT_COLORS, value)

const isEventColor = (value: unknown): value is EventColor => isPresetEventColor(value) || isHexColor(value)

export const getEventColorLabel = (color: EventColor, m: Messages) =>
  isPresetEventColor(color) ? m.colors[color] : color.toUpperCase()

export const getEventColorAttributes = (
  color: EventColor,
  ...classNamesToMerge: ClassNameValue[]
): { className?: string; style?: CSSProperties } =>
  isPresetEventColor(color)
    ? { className: classNames(...classNamesToMerge, `color-${color}`) }
    : {
        className: classNames(...classNamesToMerge) || undefined,
        style: { '--event-color': color, '--event-text': getReadableTextColor(color) } as CSSProperties,
      }

const isReminder = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_REMINDER_MINUTES

const parseReminders = (value: unknown) =>
  Array.isArray(value) ? [...new Set(value.filter(isReminder))].sort((a, b) => a - b).slice(0, MAX_REMINDERS) : []

const parseAttendee = (value: unknown): Attendee | null => {
  if (typeof value !== 'object' || value === null) return null
  const { email, name, status } = value as Record<string, unknown>
  if (typeof email !== 'string' || email === '') return null
  return {
    email: email.toLowerCase(),
    name: typeof name === 'string' ? name : '',
    status: isOneOf(ATTENDEE_STATUSES, status) ? status : 'needsAction',
  }
}

const parseAttendees = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map(parseAttendee)
        .filter((attendee): attendee is Attendee => attendee !== null)
        .slice(0, MAX_ATTENDEES)
    : []

const URL_SCHEME = /^[a-z][a-z\d+.-]*:/i

export const isWebUrl = (value: string) => {
  if (/\s/.test(value)) return false
  try {
    const { protocol, hostname } = new URL(value)
    return (protocol === 'http:' || protocol === 'https:') && hostname !== '' && !hostname.includes('%')
  } catch {
    return false
  }
}

export const normalizeLinkUrl = (value: string) => {
  const url = value.trim()
  return url === '' || URL_SCHEME.test(url) ? url : `https://${url}`
}

export const getLinkName = ({ url, label }: EventLink) => label || url.replace(/^https?:\/\//i, '').replace(/\/$/, '')

const parseLinks = (value: unknown): EventLink[] =>
  Array.isArray(value)
    ? value
        .flatMap((entry) => {
          if (typeof entry !== 'object' || entry === null) return []
          const { url, label } = entry as Record<string, unknown>
          if (typeof url !== 'string' || url.length > EVENT_LINK_URL_MAX_LENGTH || !isWebUrl(url)) return []
          return [{ url, label: typeof label === 'string' ? label.slice(0, EVENT_LINK_LABEL_MAX_LENGTH) : '' }]
        })
        .slice(0, MAX_EVENT_LINKS)
    : []

export const matchesEventText = (event: Pick<CalendarEvent, 'title' | 'location' | 'description' | 'links'>, text: string) => {
  const needle = text.trim().toLocaleLowerCase()
  return [event.title, event.location, event.description, ...event.links.flatMap(({ url, label }) => [url, label])].some(
    (field) => field.toLocaleLowerCase().includes(needle),
  )
}

export type EventReply = Exclude<AttendeeStatus, 'needsAction'>

export type EventResponse = Pick<
  CalendarEvent,
  'title' | 'location' | 'startDate' | 'start' | 'endDate' | 'end' | 'allDay' | 'timeZone'
> & { recurring: boolean; status: AttendeeStatus }

export const parseEventResponse = (value: unknown): EventResponse => {
  const record = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const text = (field: unknown) => (typeof field === 'string' ? field : '')
  const allDay = record.allDay === true
  return {
    title: text(record.title),
    location: text(record.location),
    startDate: text(record.startDate),
    start: isTime(record.start) ? record.start : ALL_DAY_TIME,
    endDate: isISODate(record.endDate) ? record.endDate : text(record.startDate),
    end: isTime(record.end) ? record.end : ALL_DAY_TIME,
    allDay,
    timeZone: !allDay && isTimeZone(record.timeZone) ? record.timeZone : null,
    recurring: record.recurring === true,
    status: isOneOf(ATTENDEE_STATUSES, record.status) ? record.status : 'needsAction',
  }
}

export const createEventUid = () => crypto.randomUUID()

export const parseCalendarEvent = (value: unknown): CalendarEvent | null => {
  if (typeof value !== 'object' || value === null) return null
  const { date, ...rest } = value as Record<string, unknown>
  const startDate = rest.startDate ?? date
  const endDate = rest.endDate ?? startDate
  const recurrence = rest.recurrence == null ? null : parseRecurrence(rest.recurrence)
  const excludedDates = Array.isArray(rest.excludedDates) ? rest.excludedDates.filter(isISODate) : []
  const seriesId = typeof rest.seriesId === 'string' ? rest.seriesId : null
  const originalDate = seriesId !== null && isISODate(rest.originalDate) ? rest.originalDate : null
  const allDay = rest.allDay === true
  const start = allDay && rest.start === undefined ? ALL_DAY_TIME : rest.start
  const end = allDay && rest.end === undefined ? ALL_DAY_TIME : rest.end

  if (
    typeof rest.id !== 'string' ||
    typeof rest.calendarId !== 'string' ||
    typeof rest.title !== 'string' ||
    !isISODate(startDate) ||
    !isTime(start) ||
    !isISODate(endDate) ||
    !isTime(end) ||
    typeof rest.description !== 'string' ||
    !isEventColor(rest.color) ||
    (rest.recurrence != null && recurrence === null)
  )
    return null

  return {
    id: rest.id,
    calendarId: rest.calendarId,
    uid: typeof rest.uid === 'string' && rest.uid !== '' ? rest.uid : rest.id,
    title: rest.title,
    location: typeof rest.location === 'string' ? rest.location : '',
    links: parseLinks(rest.links),
    startDate,
    start: allDay ? ALL_DAY_TIME : start,
    endDate,
    end: allDay ? ALL_DAY_TIME : end,
    allDay,
    timeZone: !allDay && isTimeZone(rest.timeZone) ? rest.timeZone : null,
    description: rest.description,
    color: rest.color,
    recurrence,
    excludedDates,
    seriesId: originalDate === null ? null : seriesId,
    originalDate,
    reminders: parseReminders(rest.reminders),
    attendees: parseAttendees(rest.attendees),
    createdAt: typeof rest.createdAt === 'string' ? rest.createdAt : '',
    updatedAt: typeof rest.updatedAt === 'string' ? rest.updatedAt : '',
  }
}

export type HourSlot = { date: string; hour: number }

export const ALL_DAY_TIME = '00:00'

export const createEventInputForSlots = (first: HourSlot, last: HourSlot, timeZone: string | null): EventInput => {
  const end = (last.hour + 1) * MINUTES_PER_HOUR
  const endsNextDay = end >= MINUTES_PER_DAY
  return {
    uid: createEventUid(),
    title: '',
    location: '',
    links: [],
    startDate: first.date,
    start: minutesToTime(first.hour * MINUTES_PER_HOUR),
    endDate: endsNextDay ? addDaysToISODate(last.date, 1) : last.date,
    end: minutesToTime(end % MINUTES_PER_DAY),
    allDay: false,
    timeZone,
    description: '',
    color: 'blue',
    recurrence: null,
    excludedDates: [],
    ...NO_SERIES_LINK,
    reminders: [],
    attendees: [],
  }
}

export const createEventInput = (date: string, hour: number, timeZone: string | null) =>
  createEventInputForSlots({ date, hour }, { date, hour }, timeZone)

export const createAllDayEventInput = (startDate: string, endDate = startDate): EventInput => ({
  ...createEventInputForSlots({ date: startDate, hour: 0 }, { date: startDate, hour: 0 }, null),
  start: ALL_DAY_TIME,
  endDate,
  end: ALL_DAY_TIME,
  allDay: true,
})

export const toEventInput = (event: CalendarEvent): EventInput => pick(event, EVENT_INPUT_KEYS)

export const normalizeEventInput = (input: EventInput): EventInput => ({
  ...input,
  title: input.title.trim(),
  location: input.location.trim(),
  links: input.links
    .map(({ url, label }) => ({ url: normalizeLinkUrl(url), label: label.trim() }))
    .filter(({ url, label }) => url !== '' || label !== ''),
  description: input.description.trim(),
  reminders: parseReminders(input.reminders),
  ...(input.allDay ? { start: ALL_DAY_TIME, end: ALL_DAY_TIME, timeZone: null } : {}),
  ...(input.recurrence ? NO_SERIES_LINK : { excludedDates: [] }),
})

export const toDuplicateInput = (input: EventInput): EventInput => ({
  ...input,
  uid: createEventUid(),
  excludedDates: [],
  ...NO_SERIES_LINK,
  attendees: input.attendees.map((attendee) => ({ ...attendee, status: 'needsAction' })),
})

const withoutReminders = (input: EventInput) => JSON.stringify({ ...normalizeEventInput(input), reminders: [] })

export const changesOnlyReminders = (before: EventInput, after: EventInput) =>
  withoutReminders(before) === withoutReminders(after) &&
  JSON.stringify(normalizeEventInput(before).reminders) !== JSON.stringify(normalizeEventInput(after).reminders)

export const toOccurrenceInput = (occurrence: EventOccurrence): EventInput => ({
  ...toEventInput(occurrence),
  ...occurrence.source,
})

export const getEventDuration = (period: EventPeriod & { allDay?: boolean }) =>
  period.allDay
    ? (getSpanDays(period) + 1) * MINUTES_PER_DAY
    : getSpanDays(period) * MINUTES_PER_DAY + timeToMinutes(period.end) - timeToMinutes(period.start)

const isMultiDayEvent = ({ startDate, endDate }: Pick<EventPeriod, 'startDate' | 'endDate'>) =>
  startDate !== endDate

const getSpanDays = ({ startDate, endDate }: Pick<EventPeriod, 'startDate' | 'endDate'>) =>
  daysBetween(startDate, endDate)

export const moveToStartDate = (period: Pick<EventPeriod, 'startDate' | 'endDate'>, startDate: string) => ({
  startDate,
  endDate: addDaysToISODate(startDate, getSpanDays(period)),
})

export const getActiveOccurrenceDates = (
  { startDate, recurrence, excludedDates }: SeriesRule,
  from: string,
  to: string,
) => {
  if (!recurrence) return startDate >= from && startDate <= to ? [startDate] : []
  const excluded = new Set(excludedDates)
  return getOccurrenceDates(startDate, recurrence, from, to).filter((date) => !excluded.has(date))
}

const getOccurrenceStartDates = (event: CalendarEvent, from: string, to: string) =>
  getActiveOccurrenceDates(event, addDaysToISODate(from, -getSpanDays(event)), to)

export const eventOccursInRange = (event: CalendarEvent, from: string, to: string) =>
  getOccurrenceStartDates(event, from, to).length > 0

export const toSeriesRule = (occurrence: EventOccurrence): SeriesRule => ({
  startDate: occurrence.seriesStartDate,
  recurrence: occurrence.recurrence,
  excludedDates: occurrence.excludedDates,
})

export const toViewerPeriod = (period: EventPeriod, timeZone: string | null, viewerTimeZone: string | null): EventPeriod => {
  if (!timeZone || !viewerTimeZone || timeZone === viewerTimeZone) return period
  const start = convertWallTime({ date: period.startDate, time: period.start }, timeZone, viewerTimeZone)
  const end = convertWallTime({ date: period.endDate, time: period.end }, timeZone, viewerTimeZone)
  return { startDate: start.date, start: start.time, endDate: end.date, end: end.time }
}

const overlapsRange = ({ startDate, endDate }: EventPeriod, from: string, to: string) =>
  startDate <= to && endDate >= from

export const expandEvents = (
  events: readonly CalendarEvent[],
  from: string,
  to: string,
  viewerTimeZone: string | null = null,
): EventOccurrence[] =>
  events.flatMap((event) => {
    const shifts = event.timeZone !== null && viewerTimeZone !== null && event.timeZone !== viewerTimeZone
    const searchFrom = shifts ? addDaysToISODate(from, -ZONE_SHIFT_DAYS) : from
    const searchTo = shifts ? addDaysToISODate(to, ZONE_SHIFT_DAYS) : to
    return getOccurrenceStartDates(event, searchFrom, searchTo).flatMap((startDate) => {
      const source = { start: event.start, end: event.end, ...moveToStartDate(event, startDate) }
      const period = toViewerPeriod(source, event.timeZone, viewerTimeZone)
      if (!overlapsRange(period, from, to)) return []
      return [
        {
          ...event,
          ...period,
          occurrenceKey: `${event.id}:${startDate}`,
          occurrenceDate: startDate,
          seriesStartDate: event.startDate,
          source,
        },
      ]
    })
  })

export const toViewerOccurrencePeriod = (
  event: CalendarEvent,
  startDate: string,
  viewerTimeZone: string | null,
): EventPeriod & { allDay: boolean } => ({
  allDay: event.allDay,
  ...toViewerPeriod({ start: event.start, end: event.end, ...moveToStartDate(event, startDate) }, event.timeZone, viewerTimeZone),
})

export const formatEventPeriod = (event: EventPeriod & { allDay?: boolean }, { m, format }: Pick<I18n, 'm' | 'format'>) => {
  if (event.allDay)
    return isMultiDayEvent(event)
      ? `${format.shortDay(event.startDate)} – ${format.shortDay(event.endDate)}`
      : m.events.allDay
  const start = format.time(timeToMinutes(event.start))
  const end = format.time(timeToMinutes(event.end))
  return isMultiDayEvent(event)
    ? `${format.shortDay(event.startDate)} ${start} – ${format.shortDay(event.endDate)} ${end}`
    : `${start} – ${end}`
}

export const validateEventInput = (input: EventInput, m: Messages): EventValidationErrors => {
  const errors: EventValidationErrors = {}
  const { validation } = m

  if (!input.title) errors.title = validation.titleRequired
  else if (input.title.length > EVENT_TITLE_MAX_LENGTH) errors.title = validation.titleTooLong(EVENT_TITLE_MAX_LENGTH)

  if (!isISODate(input.startDate)) errors.startDate = validation.startDateInvalid
  if (!input.allDay && !isTime(input.start)) errors.start = validation.startTimeInvalid
  if (!isISODate(input.endDate)) errors.endDate = validation.endDateInvalid
  if (!input.allDay && !isTime(input.end)) errors.end = validation.endTimeInvalid

  if (!errors.startDate && !errors.endDate && input.endDate < input.startDate)
    errors.endDate = validation.endDateBeforeStart
  else if (!errors.startDate && !errors.start && !errors.endDate && !errors.end && getEventDuration(input) <= 0)
    errors.end = validation.endBeforeStart

  if (input.recurrence) {
    const recurrenceErrors = validateRecurrence(input.recurrence, input.startDate, m)
    if (hasRecurrenceErrors(recurrenceErrors)) errors.recurrence = recurrenceErrors
  }

  if (input.location.length > EVENT_LOCATION_MAX_LENGTH)
    errors.location = validation.locationTooLong(EVENT_LOCATION_MAX_LENGTH)

  if (
    input.links.length > MAX_EVENT_LINKS ||
    input.links.some(
      ({ url, label }) =>
        url.length > EVENT_LINK_URL_MAX_LENGTH || label.length > EVENT_LINK_LABEL_MAX_LENGTH || !isWebUrl(url),
    )
  )
    errors.links = validation.linkInvalid

  if (input.description.length > EVENT_DESCRIPTION_MAX_LENGTH)
    errors.description = validation.descriptionTooLong(EVENT_DESCRIPTION_MAX_LENGTH)

  return errors
}

export const hasValidationErrors = ({ recurrence, ...fields }: EventValidationErrors) =>
  hasFieldErrors(fields) || (recurrence !== undefined && hasRecurrenceErrors(recurrence))
