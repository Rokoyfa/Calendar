import type { CSSProperties } from 'react'
import {
  addDaysToISODate,
  daysBetween,
  formatShortDay,
  isISODate,
  isTime,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  minutesToTime,
  timeToMinutes,
} from './date.ts'
import { getReadableTextColor, isHexColor, type HexColor } from './color.ts'
import { pick } from './object.ts'
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

export const PRESET_EVENT_COLOR_LABELS: Record<PresetEventColor, string> = {
  blue: 'Blau',
  red: 'Rot',
  green: 'Grün',
  yellow: 'Gelb',
}

export const EVENT_TITLE_MAX_LENGTH = 100
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000

export type CalendarEvent = {
  id: string
  calendarId: string
  title: string
  startDate: string
  start: string
  endDate: string
  end: string
  description: string
  color: EventColor
  recurrence: Recurrence | null
  excludedDates: string[]
  seriesId: string | null
  originalDate: string | null
  createdAt: string
  updatedAt: string
}

const EVENT_INPUT_KEYS = [
  'title',
  'startDate',
  'start',
  'endDate',
  'end',
  'description',
  'color',
  'recurrence',
  'excludedDates',
  'seriesId',
  'originalDate',
] as const satisfies readonly (keyof CalendarEvent)[]

export type EventInput = Pick<CalendarEvent, (typeof EVENT_INPUT_KEYS)[number]>

export const NO_SERIES_LINK = { seriesId: null, originalDate: null } as const satisfies Partial<EventInput>

export type EventOccurrence = CalendarEvent & {
  occurrenceKey: string
  seriesStartDate: string
}

export type EditScope = 'single' | 'following' | 'all'

export type EventPeriod = Pick<CalendarEvent, 'startDate' | 'start' | 'endDate' | 'end'>

export type SeriesRule = Pick<CalendarEvent, 'startDate' | 'recurrence' | 'excludedDates'>

export type EventValidationErrors = Partial<Record<Exclude<keyof EventInput, 'recurrence'>, string>> & {
  recurrence?: RecurrenceValidationErrors
}

export const EVENT_NOT_FOUND_MESSAGE = 'Der Termin wurde nicht gefunden.'

export const isPresetEventColor = (value: unknown): value is PresetEventColor =>
  PRESET_EVENT_COLORS.includes(value as PresetEventColor)

export const isEventColor = (value: unknown): value is EventColor => isPresetEventColor(value) || isHexColor(value)

export const getEventColorLabel = (color: EventColor) =>
  isPresetEventColor(color) ? PRESET_EVENT_COLOR_LABELS[color] : color.toUpperCase()

export const getEventColorAttributes = (color: EventColor): { className?: string; style?: CSSProperties } =>
  isPresetEventColor(color)
    ? { className: `color-${color}` }
    : { style: { '--event-color': color, '--event-text': getReadableTextColor(color) } as CSSProperties }

export const parseCalendarEvent = (value: unknown): CalendarEvent | null => {
  if (typeof value !== 'object' || value === null) return null
  const { date, ...rest } = value as Record<string, unknown>
  const startDate = rest.startDate ?? date
  const endDate = rest.endDate ?? startDate
  const recurrence = rest.recurrence == null ? null : parseRecurrence(rest.recurrence)
  const excludedDates = Array.isArray(rest.excludedDates) ? rest.excludedDates.filter(isISODate) : []
  const seriesId = typeof rest.seriesId === 'string' ? rest.seriesId : null
  const originalDate = seriesId !== null && isISODate(rest.originalDate) ? rest.originalDate : null

  if (
    typeof rest.id !== 'string' ||
    typeof rest.calendarId !== 'string' ||
    typeof rest.title !== 'string' ||
    !isISODate(startDate) ||
    !isTime(rest.start) ||
    !isISODate(endDate) ||
    !isTime(rest.end) ||
    typeof rest.description !== 'string' ||
    !isEventColor(rest.color) ||
    (rest.recurrence != null && recurrence === null)
  )
    return null

  return {
    id: rest.id,
    calendarId: rest.calendarId,
    title: rest.title,
    startDate,
    start: rest.start,
    endDate,
    end: rest.end,
    description: rest.description,
    color: rest.color,
    recurrence,
    excludedDates,
    seriesId: originalDate === null ? null : seriesId,
    originalDate,
    createdAt: typeof rest.createdAt === 'string' ? rest.createdAt : '',
    updatedAt: typeof rest.updatedAt === 'string' ? rest.updatedAt : '',
  }
}

export const createEventInput = (date: string, hour: number): EventInput => {
  const start = hour * MINUTES_PER_HOUR
  const end = start + MINUTES_PER_HOUR
  const endsNextDay = end >= MINUTES_PER_DAY
  return {
    title: '',
    startDate: date,
    start: minutesToTime(start),
    endDate: endsNextDay ? addDaysToISODate(date, 1) : date,
    end: minutesToTime(end % MINUTES_PER_DAY),
    description: '',
    color: 'blue',
    recurrence: null,
    excludedDates: [],
    ...NO_SERIES_LINK,
  }
}

export const toEventInput = (event: CalendarEvent): EventInput => pick(event, EVENT_INPUT_KEYS)

export const normalizeEventInput = (input: EventInput): EventInput => ({
  ...input,
  title: input.title.trim(),
  description: input.description.trim(),
  ...(input.recurrence ? NO_SERIES_LINK : { excludedDates: [] }),
})

export const getEventDuration = (period: EventPeriod) =>
  getSpanDays(period) * MINUTES_PER_DAY + timeToMinutes(period.end) - timeToMinutes(period.start)

export const isMultiDayEvent = ({ startDate, endDate }: Pick<EventPeriod, 'startDate' | 'endDate'>) =>
  startDate !== endDate

export const getSpanDays = ({ startDate, endDate }: Pick<EventPeriod, 'startDate' | 'endDate'>) =>
  daysBetween(startDate, endDate)

export const moveToStartDate = (period: Pick<EventPeriod, 'startDate' | 'endDate'>, startDate: string) => ({
  startDate,
  endDate: addDaysToISODate(startDate, getSpanDays(period)),
})

export const getActiveOccurrenceDates = ({ startDate, recurrence, excludedDates }: SeriesRule, from: string, to: string) => {
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

export const expandEvents = (events: readonly CalendarEvent[], from: string, to: string): EventOccurrence[] =>
  events.flatMap((event) =>
    getOccurrenceStartDates(event, from, to).map((startDate) => ({
      ...event,
      ...moveToStartDate(event, startDate),
      occurrenceKey: `${event.id}:${startDate}`,
      seriesStartDate: event.startDate,
    })),
  )

export const formatEventPeriod = (event: EventPeriod) =>
  isMultiDayEvent(event)
    ? `${formatShortDay(event.startDate)} ${event.start} – ${formatShortDay(event.endDate)} ${event.end}`
    : `${event.start} – ${event.end}`

export const validateEventInput = (input: EventInput): EventValidationErrors => {
  const errors: EventValidationErrors = {}

  if (!input.title) errors.title = 'Bitte einen Titel eingeben.'
  else if (input.title.length > EVENT_TITLE_MAX_LENGTH)
    errors.title = `Der Titel darf höchstens ${EVENT_TITLE_MAX_LENGTH} Zeichen lang sein.`

  if (!isISODate(input.startDate)) errors.startDate = 'Bitte ein gültiges Startdatum wählen.'
  if (!isTime(input.start)) errors.start = 'Bitte eine gültige Startzeit wählen.'
  if (!isISODate(input.endDate)) errors.endDate = 'Bitte ein gültiges Enddatum wählen.'
  if (!isTime(input.end)) errors.end = 'Bitte eine gültige Endzeit wählen.'

  if (!errors.startDate && !errors.endDate && input.endDate < input.startDate)
    errors.endDate = 'Das Enddatum darf nicht vor dem Startdatum liegen.'
  else if (!errors.startDate && !errors.start && !errors.endDate && !errors.end && getEventDuration(input) <= 0)
    errors.end = 'Das Ende muss nach dem Beginn liegen.'

  if (input.recurrence) {
    const recurrenceErrors = validateRecurrence(input.recurrence, input.startDate)
    if (hasRecurrenceErrors(recurrenceErrors)) errors.recurrence = recurrenceErrors
  }

  if (input.description.length > EVENT_DESCRIPTION_MAX_LENGTH)
    errors.description = `Die Beschreibung darf höchstens ${EVENT_DESCRIPTION_MAX_LENGTH} Zeichen lang sein.`

  return errors
}

export const hasValidationErrors = ({ recurrence, ...fields }: EventValidationErrors) =>
  Object.values(fields).some(Boolean) || (recurrence !== undefined && hasRecurrenceErrors(recurrence))
