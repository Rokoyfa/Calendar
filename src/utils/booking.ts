import { ROUTES } from '../config/routes.ts'
import type { HostLinks } from '../context/HostContext.ts'
import { timeToMinutes } from './date.ts'
import { isEventColor, type EventColor } from './event.ts'
import { buildHostLink } from './hostLink.ts'
import { isOneOf } from './object.ts'
import { asRecord, parseList, textOrEmpty } from './parse.ts'
import { fromInstant, isTimeZone, type WallTime } from './timeZone.ts'

export const MAX_BOOKING_PAGES = 10
export const MAX_BOOKING_HOURS = 21
export const BOOKING_TITLE_MAX_LENGTH = 100
export const BOOKING_NAME_MAX_LENGTH = 80
export const BOOKING_DESCRIPTION_MAX_LENGTH = 1000
export const BOOKING_LOCATION_MAX_LENGTH = 200
export const BOOKING_NOTE_MAX_LENGTH = 1000
export const BOOKING_HOLD_MINUTES = 15
export const BOOKING_DAY_END = '24:00'
export const BOOKING_LIMITS = {
  durationMinutes: { min: 5, max: 480, step: 5 },
  bufferMinutes: { min: 0, max: 240, step: 5 },
  minNoticeMinutes: { min: 0, max: 43_200, step: 5 },
  horizonDays: { min: 1, max: 365, step: 1 },
  stepMinutes: { min: 5, max: 240, step: 5 },
  maxPerDay: { min: 1, max: 50, step: 1 },
} as const

const BOOKING_STATUSES = ['pending', 'confirmed', 'canceled'] as const
const BOOKING_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export type BookingHours = { weekday: number; start: string; end: string }

export type BookingPageSettings = {
  title: string
  description: string
  location: string
  durationMinutes: number
  bufferMinutes: number
  minNoticeMinutes: number
  horizonDays: number
  maxPerDay: number | null
  stepMinutes: number
  timeZone: string
  hours: BookingHours[]
  active: boolean
}

export type BookingPage = BookingPageSettings & {
  id: string
  calendarId: string
  token: string
  createdAt: string
  updatedAt: string
}

export type PublicBookingPage = {
  title: string
  description: string
  location: string
  durationMinutes: number
  timeZone: string
  hostName: string
  color: EventColor
}

export type BookingRequest = { start: string; name: string; email: string; note: string }

export type BookingHold = { expiresAt: string }

export type BookingSummary = {
  status: BookingStatus
  title: string
  location: string
  hostName: string
  start: string
  end: string
  timeZone: string
}

export type BookingSlot = WallTime & { start: string }

export type BookingHoursProblem = 'order' | 'overlap' | 'tooMany'

const WORKDAYS = [0, 1, 2, 3, 4]

export const defaultBookingSettings = (timeZone: string): BookingPageSettings => ({
  title: '',
  description: '',
  location: '',
  durationMinutes: 30,
  bufferMinutes: 0,
  minNoticeMinutes: 120,
  horizonDays: 60,
  maxPerDay: null,
  stepMinutes: 30,
  timeZone,
  hours: WORKDAYS.map((weekday) => ({ weekday, start: '09:00', end: '17:00' })),
  active: true,
})

const isWholeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)

const isInstant = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))

const parseHours = (value: unknown): BookingHours | null => {
  const { weekday, start, end } = asRecord(value)
  if (!isWholeNumber(weekday) || weekday < 0 || weekday > 6) return null
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!BOOKING_TIME_PATTERN.test(start) || !BOOKING_TIME_PATTERN.test(end)) return null
  return { weekday, start, end }
}

export const parseBookingPage = (value: unknown): BookingPage | null => {
  const record = asRecord(value)
  const numbers = [
    record.durationMinutes,
    record.bufferMinutes,
    record.minNoticeMinutes,
    record.horizonDays,
    record.stepMinutes,
  ]
  if (
    typeof record.id !== 'string' ||
    typeof record.calendarId !== 'string' ||
    typeof record.token !== 'string' ||
    typeof record.title !== 'string' ||
    !isTimeZone(record.timeZone) ||
    !numbers.every(isWholeNumber)
  )
    return null
  return {
    id: record.id,
    calendarId: record.calendarId,
    token: record.token,
    title: record.title,
    description: textOrEmpty(record.description),
    location: textOrEmpty(record.location),
    durationMinutes: record.durationMinutes as number,
    bufferMinutes: record.bufferMinutes as number,
    minNoticeMinutes: record.minNoticeMinutes as number,
    horizonDays: record.horizonDays as number,
    maxPerDay: isWholeNumber(record.maxPerDay) ? record.maxPerDay : null,
    stepMinutes: record.stepMinutes as number,
    timeZone: record.timeZone,
    hours: parseList(record.hours, parseHours),
    active: record.active !== false,
    createdAt: textOrEmpty(record.createdAt),
    updatedAt: textOrEmpty(record.updatedAt),
  }
}

export const parseBookingPages = (value: unknown) =>
  parseList(value, parseBookingPage).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

export const parsePublicBookingPage = (value: unknown): PublicBookingPage | null => {
  const record = asRecord(value)
  if (typeof record.title !== 'string' || !isWholeNumber(record.durationMinutes) || !isTimeZone(record.timeZone))
    return null
  return {
    title: record.title,
    description: textOrEmpty(record.description),
    location: textOrEmpty(record.location),
    durationMinutes: record.durationMinutes,
    timeZone: record.timeZone,
    hostName: textOrEmpty(record.hostName),
    color: isEventColor(record.color) ? record.color : 'blue',
  }
}

export const parseBookingSlots = (value: unknown) => {
  const { slots } = asRecord(value)
  return Array.isArray(slots)
    ? slots
        .filter(isInstant)
        .map((slot) => new Date(slot).toISOString())
        .sort()
    : []
}

export const parseBookingHold = (value: unknown): BookingHold | null => {
  const { expiresAt } = asRecord(value)
  return isInstant(expiresAt) ? { expiresAt } : null
}

export const parseBookingSummary = (value: unknown): BookingSummary | null => {
  const record = asRecord(value)
  if (
    !isOneOf(BOOKING_STATUSES, record.status) ||
    typeof record.title !== 'string' ||
    !isInstant(record.start) ||
    !isInstant(record.end) ||
    !isTimeZone(record.timeZone)
  )
    return null
  return {
    status: record.status,
    title: record.title,
    location: textOrEmpty(record.location),
    hostName: textOrEmpty(record.hostName),
    start: record.start,
    end: record.end,
    timeZone: record.timeZone,
  }
}

export const getBookingPath = (token: string) => ROUTES.booking.replace(':token', encodeURIComponent(token))

export const buildBookingLink = (token: string, links: HostLinks | undefined, pageUrl: string) =>
  buildHostLink(getBookingPath(token), links, pageUrl)

export const sortBookingHours = (hours: readonly BookingHours[]) =>
  [...hours].sort((a, b) => a.weekday - b.weekday || timeToMinutes(a.start) - timeToMinutes(b.start))

export const findBookingHoursProblem = (hours: readonly BookingHours[]): BookingHoursProblem | null => {
  if (hours.length > MAX_BOOKING_HOURS) return 'tooMany'
  if (hours.some(({ start, end }) => timeToMinutes(start) >= timeToMinutes(end))) return 'order'
  const sorted = sortBookingHours(hours)
  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1]
    const current = sorted[index]
    if (current.weekday === previous.weekday && timeToMinutes(current.start) < timeToMinutes(previous.end))
      return 'overlap'
  }
  return null
}

export const toBookingEndTime = (inputTime: string) => (inputTime === '00:00' ? BOOKING_DAY_END : inputTime)

export const toTimeInput = (time: string) => (time === BOOKING_DAY_END ? '00:00' : time)

export const toBookingSlots = (slots: readonly string[], timeZone: string): BookingSlot[] =>
  slots.map((start) => ({ start, ...fromInstant(Date.parse(start), timeZone) }))

export const groupBookingSlots = (slots: readonly BookingSlot[]) => {
  const days = new Map<string, BookingSlot[]>()
  for (const slot of slots) days.set(slot.date, [...(days.get(slot.date) ?? []), slot])
  return days
}

export const isBookingCancelable = (summary: BookingSummary, now = Date.now()) =>
  summary.status === 'confirmed' && Date.parse(summary.start) > now
