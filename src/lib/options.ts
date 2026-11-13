import type { HostTheme } from '../context/HostContext.ts'
import type { MessageOverrides } from '../i18n/index.ts'
import { CALENDAR_VIEWS, isCalendarView, type CalendarView } from '../utils/calendarView.ts'
import { isOneOf } from '../utils/object.ts'
import {
  FEATURE_NAMES,
  HOLIDAY_SOURCES,
  STORAGE_MODES,
  type CalendarFeatures,
  type HolidaySource,
  type StorageMode,
} from './defaults.ts'

export const ROUTING_MODES = ['memory', 'browser'] as const

export type CalendarRouting = (typeof ROUTING_MODES)[number]

export const HOST_THEMES = ['light', 'dark'] as const

export type CalendarOptions = {
  tenant?: string
  storageMode?: StorageMode
  apiBaseUrl?: string
  apiTimeoutMs?: number
  features?: Partial<CalendarFeatures>
  views?: readonly CalendarView[]
  routing?: CalendarRouting
  basename?: string
  initialPath?: string
  linkParam?: string | false
  locale?: string
  messages?: MessageOverrides
  theme?: HostTheme
  initialView?: CalendarView
  timeZone?: string
  holidays?: string
  holidaySource?: HolidaySource
  mapUrl?: string
}

export type CalendarOptionName = keyof CalendarOptions

export type ParsedOptions = { options: CalendarOptions; issues: string[] }

type Reader = (value: unknown, name: string) => unknown

const INVALID = Symbol('invalid')

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text: Reader = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : INVALID)

const oneOf =
  (values: readonly string[]): Reader =>
  (value) =>
    isOneOf(values, value) ? value : INVALID

const positiveInteger: Reader = (value) => (Number.isInteger(value) && (value as number) > 0 ? value : INVALID)

const linkParam: Reader = (value) => (value === false ? false : text(value, ''))

const messages: Reader = (value) =>
  isPlainObject(value) && Object.values(value).every(isPlainObject) ? value : INVALID

const EXPECTED: Record<CalendarOptionName, string> = {
  tenant: 'a non-empty string',
  storageMode: STORAGE_MODES.join(' or '),
  apiBaseUrl: 'a non-empty string',
  apiTimeoutMs: 'a positive integer',
  features: 'an object of feature names and booleans',
  views: `a list with at least one of ${CALENDAR_VIEWS.join(', ')}`,
  routing: ROUTING_MODES.join(' or '),
  basename: 'a non-empty string',
  initialPath: 'a non-empty string',
  linkParam: 'a non-empty string or false',
  locale: 'a non-empty string',
  messages: 'an object of languages and their texts',
  theme: HOST_THEMES.join(' or '),
  initialView: CALENDAR_VIEWS.join(', '),
  timeZone: 'a non-empty string',
  holidays: 'a non-empty string',
  holidaySource: HOLIDAY_SOURCES.join(' or '),
  mapUrl: 'a non-empty string',
}

export const OPTION_NAMES = Object.keys(EXPECTED) as CalendarOptionName[]

export function parseCalendarOptions(value: unknown): ParsedOptions {
  const issues: string[] = []
  if (!isPlainObject(value)) return { options: {}, issues: ['The configuration must be an object.'] }

  const features: Reader = (raw) => {
    if (!isPlainObject(raw)) return INVALID
    const result: Partial<CalendarFeatures> = {}
    for (const [name, enabled] of Object.entries(raw)) {
      if (!isOneOf(FEATURE_NAMES, name)) issues.push(`Unknown feature "${name}".`)
      else if (typeof enabled !== 'boolean') issues.push(`Feature "${name}" must be true or false.`)
      else result[name] = enabled
    }
    return result
  }

  const views: Reader = (raw) => {
    if (!Array.isArray(raw)) return INVALID
    const valid = raw.filter(isCalendarView)
    return valid.length > 0 && valid.length === raw.length ? valid : INVALID
  }

  const readers: Record<CalendarOptionName, Reader> = {
    tenant: text,
    storageMode: oneOf(STORAGE_MODES),
    apiBaseUrl: text,
    apiTimeoutMs: positiveInteger,
    features,
    views,
    routing: oneOf(ROUTING_MODES),
    basename: text,
    initialPath: text,
    linkParam,
    locale: text,
    messages,
    theme: oneOf(HOST_THEMES),
    initialView: oneOf(CALENDAR_VIEWS),
    timeZone: text,
    holidays: text,
    holidaySource: oneOf(HOLIDAY_SOURCES),
    mapUrl: text,
  }

  const options: Record<string, unknown> = {}
  for (const [name, raw] of Object.entries(value)) {
    if (name === '$schema' || raw === undefined || raw === null) continue
    if (!isOneOf(OPTION_NAMES, name)) {
      issues.push(`Unknown option "${name}".`)
      continue
    }
    const parsed = readers[name](raw, name)
    if (parsed === INVALID) issues.push(`Option "${name}" must be ${EXPECTED[name]}.`)
    else options[name] = parsed
  }
  return { options: options as CalendarOptions, issues }
}

export function mergeCalendarOptions(base: CalendarOptions, overrides: CalendarOptions): CalendarOptions {
  const merged: Record<string, unknown> = { ...base }
  for (const name of OPTION_NAMES) if (overrides[name] !== undefined) merged[name] = overrides[name]
  const features: Partial<CalendarFeatures> = { ...base.features }
  for (const name of FEATURE_NAMES) {
    const value = overrides.features?.[name]
    if (value !== undefined) features[name] = value
  }
  return { ...merged, features } as CalendarOptions
}
