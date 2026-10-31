import {
  addDaysToISODate,
  daysBetween,
  formatShortDay,
  ISO_DATE_PATTERN,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  minutesToTime,
  TIME_PATTERN,
  timeToMinutes,
} from './date.ts'
import { isHexColor, type HexColor } from './color.ts'
import {
  getOccurrenceDates,
  isSameRecurrence,
  parseRecurrence,
  shiftWeekdays,
  validateRecurrence,
  type Recurrence,
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
  createdAt: string
  updatedAt: string
}

export type EventInput = Pick<
  CalendarEvent,
  'title' | 'startDate' | 'start' | 'endDate' | 'end' | 'description' | 'color' | 'recurrence' | 'excludedDates'
>

export type EventOccurrence = CalendarEvent & {
  occurrenceKey: string
}

export type EditScope = 'single' | 'all'

export type EventPeriod = Pick<CalendarEvent, 'startDate' | 'start' | 'endDate' | 'end'>

export type EventValidationErrors = Partial<
  Record<keyof EventInput | 'recurrenceInterval' | 'recurrenceWeekdays' | 'recurrenceUntil', string>
>

export const isPresetEventColor = (value: unknown): value is PresetEventColor =>
  PRESET_EVENT_COLORS.includes(value as PresetEventColor)

export const isEventColor = (value: unknown): value is EventColor => isPresetEventColor(value) || isHexColor(value)

export const getEventColorLabel = (color: EventColor) =>
  isPresetEventColor(color) ? PRESET_EVENT_COLOR_LABELS[color] : color.toUpperCase()

const isISODate = (value: unknown): value is string => typeof value === 'string' && ISO_DATE_PATTERN.test(value)

const isTime = (value: unknown): value is string => typeof value === 'string' && TIME_PATTERN.test(value)

export const parseCalendarEvent = (value: unknown): CalendarEvent | null => {
  if (typeof value !== 'object' || value === null) return null
  const { date, ...rest } = value as Record<string, unknown>
  const startDate = rest.startDate ?? date
  const endDate = rest.endDate ?? startDate
  const recurrence = rest.recurrence == null ? null : parseRecurrence(rest.recurrence)
  const excludedDates = Array.isArray(rest.excludedDates) ? rest.excludedDates.filter(isISODate) : []

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
  }
}

export const toEventInput = ({
  title,
  startDate,
  start,
  endDate,
  end,
  description,
  color,
  recurrence,
  excludedDates,
}: CalendarEvent): EventInput => ({
  title,
  startDate,
  start,
  endDate,
  end,
  description,
  color,
  recurrence,
  excludedDates,
})

export const normalizeEventInput = (input: EventInput): EventInput => ({
  ...input,
  title: input.title.trim(),
  description: input.description.trim(),
})

export const getEventDuration = ({ startDate, start, endDate, end }: EventPeriod) =>
  daysBetween(startDate, endDate) * MINUTES_PER_DAY + timeToMinutes(end) - timeToMinutes(start)

export const isMultiDayEvent = ({ startDate, endDate }: EventPeriod) => startDate !== endDate

const getOccurrenceStartDates = (event: CalendarEvent, from: string, to: string) => {
  const span = daysBetween(event.startDate, event.endDate)
  const windowStart = addDaysToISODate(from, -span)
  if (!event.recurrence) return event.startDate >= windowStart && event.startDate <= to ? [event.startDate] : []
  const excluded = new Set(event.excludedDates)
  return getOccurrenceDates(event.startDate, event.recurrence, windowStart, to).filter((date) => !excluded.has(date))
}

export const eventOccursInRange = (event: CalendarEvent, from: string, to: string) =>
  getOccurrenceStartDates(event, from, to).length > 0

export const expandEvents = (events: readonly CalendarEvent[], from: string, to: string): EventOccurrence[] =>
  events.flatMap((event) => {
    const span = daysBetween(event.startDate, event.endDate)
    return getOccurrenceStartDates(event, from, to).map((startDate) => ({
      ...event,
      startDate,
      endDate: addDaysToISODate(startDate, span),
      occurrenceKey: `${event.id}:${startDate}`,
    }))
  })

export const excludeOccurrence = (series: CalendarEvent, occurrenceDate: string): EventInput => ({
  ...toEventInput(series),
  excludedDates: [...new Set([...series.excludedDates, occurrenceDate])].toSorted(),
})

export const detachOccurrence = (input: EventInput): EventInput => ({
  ...input,
  recurrence: null,
  excludedDates: [],
})

export const applyToSeries = (series: CalendarEvent, occurrenceDate: string, input: EventInput): EventInput => {
  const shift = daysBetween(occurrenceDate, input.startDate)
  const startDate = addDaysToISODate(series.startDate, shift)
  const keepsRecurrence = isSameRecurrence(series.recurrence, input.recurrence)
  const recurrence =
    keepsRecurrence && input.recurrence?.frequency === 'weekly' && shift !== 0
      ? { ...input.recurrence, weekdays: shiftWeekdays(input.recurrence.weekdays, shift) }
      : input.recurrence

  return {
    ...input,
    startDate,
    endDate: addDaysToISODate(startDate, daysBetween(input.startDate, input.endDate)),
    recurrence,
    excludedDates: series.excludedDates.map((date) => addDaysToISODate(date, shift)),
  }
}

export const compareEvents = (a: CalendarEvent, b: CalendarEvent) =>
  a.startDate.localeCompare(b.startDate) ||
  a.start.localeCompare(b.start) ||
  getEventDuration(b) - getEventDuration(a) ||
  a.title.localeCompare(b.title)

export const formatEventPeriod = (event: EventPeriod) =>
  isMultiDayEvent(event)
    ? `${formatShortDay(event.startDate)} ${event.start} – ${formatShortDay(event.endDate)} ${event.end}`
    : `${event.start} – ${event.end}`

export const validateEventInput = (input: EventInput): EventValidationErrors => {
  const errors: EventValidationErrors = {}

  if (!input.title) errors.title = 'Bitte einen Titel eingeben.'
  else if (input.title.length > EVENT_TITLE_MAX_LENGTH)
    errors.title = `Der Titel darf höchstens ${EVENT_TITLE_MAX_LENGTH} Zeichen lang sein.`

  if (!ISO_DATE_PATTERN.test(input.startDate)) errors.startDate = 'Bitte ein gültiges Startdatum wählen.'
  if (!TIME_PATTERN.test(input.start)) errors.start = 'Bitte eine gültige Startzeit wählen.'
  if (!ISO_DATE_PATTERN.test(input.endDate)) errors.endDate = 'Bitte ein gültiges Enddatum wählen.'
  if (!TIME_PATTERN.test(input.end)) errors.end = 'Bitte eine gültige Endzeit wählen.'

  if (!errors.startDate && !errors.endDate && input.endDate < input.startDate)
    errors.endDate = 'Das Enddatum darf nicht vor dem Startdatum liegen.'
  else if (!errors.startDate && !errors.start && !errors.endDate && !errors.end && getEventDuration(input) <= 0)
    errors.end = 'Das Ende muss nach dem Beginn liegen.'

  if (input.recurrence) {
    const recurrenceErrors = validateRecurrence(input.recurrence, input.startDate)
    if (recurrenceErrors.interval) errors.recurrenceInterval = recurrenceErrors.interval
    if (recurrenceErrors.weekdays) errors.recurrenceWeekdays = recurrenceErrors.weekdays
    if (recurrenceErrors.until) errors.recurrenceUntil = recurrenceErrors.until
  }

  if (input.description.length > EVENT_DESCRIPTION_MAX_LENGTH)
    errors.description = `Die Beschreibung darf höchstens ${EVENT_DESCRIPTION_MAX_LENGTH} Zeichen lang sein.`

  return errors
}

export const hasValidationErrors = (errors: EventValidationErrors) => Object.values(errors).some(Boolean)
