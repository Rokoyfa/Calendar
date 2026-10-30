import {
  ISO_DATE_PATTERN,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  minutesToTime,
  TIME_PATTERN,
  timeToMinutes,
} from './date.ts'
import { isHexColor, type HexColor } from './color.ts'

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
  date: string
  start: string
  end: string
  description: string
  color: EventColor
  createdAt: string
  updatedAt: string
}

export type EventInput = Pick<CalendarEvent, 'title' | 'date' | 'start' | 'end' | 'description' | 'color'>

export type EventValidationErrors = Partial<Record<keyof EventInput, string>>

export const isPresetEventColor = (value: unknown): value is PresetEventColor =>
  PRESET_EVENT_COLORS.includes(value as PresetEventColor)

export const isEventColor = (value: unknown): value is EventColor => isPresetEventColor(value) || isHexColor(value)

export const getEventColorLabel = (color: EventColor) =>
  isPresetEventColor(color) ? PRESET_EVENT_COLOR_LABELS[color] : color.toUpperCase()

export const isCalendarEvent = (value: unknown): value is CalendarEvent => {
  if (typeof value !== 'object' || value === null) return false
  const event = value as Record<string, unknown>
  return (
    typeof event.id === 'string' &&
    typeof event.calendarId === 'string' &&
    typeof event.title === 'string' &&
    typeof event.date === 'string' &&
    ISO_DATE_PATTERN.test(event.date) &&
    typeof event.start === 'string' &&
    TIME_PATTERN.test(event.start) &&
    typeof event.end === 'string' &&
    TIME_PATTERN.test(event.end) &&
    typeof event.description === 'string' &&
    isEventColor(event.color)
  )
}

export const createEventInput = (date: string, hour: number): EventInput => {
  const start = hour * MINUTES_PER_HOUR
  return {
    title: '',
    date,
    start: minutesToTime(start),
    end: minutesToTime(Math.min(start + MINUTES_PER_HOUR, MINUTES_PER_DAY - 1)),
    description: '',
    color: 'blue',
  }
}

export const toEventInput = ({ title, date, start, end, description, color }: CalendarEvent): EventInput => ({
  title,
  date,
  start,
  end,
  description,
  color,
})

export const normalizeEventInput = (input: EventInput): EventInput => ({
  ...input,
  title: input.title.trim(),
  description: input.description.trim(),
})

export const getEventDuration = ({ start, end }: Pick<CalendarEvent, 'start' | 'end'>) =>
  timeToMinutes(end) - timeToMinutes(start)

export const compareEvents = (a: CalendarEvent, b: CalendarEvent) =>
  a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title)

export const groupEventsByDate = (events: readonly CalendarEvent[]) => {
  const groups = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const group = groups.get(event.date)
    if (group) group.push(event)
    else groups.set(event.date, [event])
  }
  return groups
}

export const validateEventInput = (input: EventInput): EventValidationErrors => {
  const errors: EventValidationErrors = {}

  if (!input.title) errors.title = 'Bitte einen Titel eingeben.'
  else if (input.title.length > EVENT_TITLE_MAX_LENGTH)
    errors.title = `Der Titel darf höchstens ${EVENT_TITLE_MAX_LENGTH} Zeichen lang sein.`

  if (!ISO_DATE_PATTERN.test(input.date)) errors.date = 'Bitte ein gültiges Datum wählen.'

  if (!TIME_PATTERN.test(input.start)) errors.start = 'Bitte eine gültige Startzeit wählen.'

  if (!TIME_PATTERN.test(input.end)) errors.end = 'Bitte eine gültige Endzeit wählen.'
  else if (!errors.start && timeToMinutes(input.end) <= timeToMinutes(input.start))
    errors.end = 'Das Ende muss nach dem Beginn liegen.'

  if (input.description.length > EVENT_DESCRIPTION_MAX_LENGTH)
    errors.description = `Die Beschreibung darf höchstens ${EVENT_DESCRIPTION_MAX_LENGTH} Zeichen lang sein.`

  return errors
}

export const hasValidationErrors = (errors: EventValidationErrors) => Object.values(errors).some(Boolean)
