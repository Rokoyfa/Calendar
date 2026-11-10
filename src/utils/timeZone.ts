import { MINUTES_PER_HOUR } from './date.ts'

export type WallTime = { date: string; time: string }

const MS_PER_MINUTE = 60_000

const formatters = new Map<string, Intl.DateTimeFormat>()

const getFormatter = (timeZone: string) => {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    formatters.set(timeZone, formatter)
  }
  return formatter
}

export const isTimeZone = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return false
  try {
    getFormatter(value)
    return true
  } catch {
    return false
  }
}

export const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const listTimeZones = (): string[] => {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone')
  return supported?.length ? supported : [getBrowserTimeZone(), 'UTC']
}

const toWallTime = (instant: number, timeZone: string): WallTime => {
  const parts = Object.fromEntries(getFormatter(timeZone).formatToParts(new Date(instant)).map((part) => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

const wallTimeAsUtc = ({ date, time }: WallTime) => {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return Date.UTC(year, month - 1, day, hour, minute)
}

const offsetAt = (instant: number, timeZone: string) => {
  const minute = Math.floor(instant / MS_PER_MINUTE) * MS_PER_MINUTE
  return wallTimeAsUtc(toWallTime(minute, timeZone)) - minute
}

export const toInstant = (wallTime: WallTime, timeZone: string) => {
  const asUtc = wallTimeAsUtc(wallTime)
  const first = asUtc - offsetAt(asUtc, timeZone)
  const second = asUtc - offsetAt(first, timeZone)
  return Math.max(first, second)
}

export const fromInstant = (instant: number, timeZone: string) => toWallTime(instant, timeZone)

export const convertWallTime = (wallTime: WallTime, from: string, to: string): WallTime =>
  from === to ? wallTime : fromInstant(toInstant(wallTime, from), to)

export const formatTimeZoneOffset = (timeZone: string, at = Date.now()) => {
  const minutes = Math.round(offsetAt(at, timeZone) / MS_PER_MINUTE)
  const sign = minutes < 0 ? '−' : '+'
  const absolute = Math.abs(minutes)
  const hours = Math.floor(absolute / MINUTES_PER_HOUR)
  const rest = absolute % MINUTES_PER_HOUR
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`
}
