export const STORAGE_MODES = ['local', 'remote'] as const

export type StorageMode = (typeof STORAGE_MODES)[number]

export const HOLIDAY_SOURCES = ['library', 'backend'] as const

export type HolidaySource = (typeof HOLIDAY_SOURCES)[number]

export type CalendarFeatures = {
  auth: boolean
  teams: boolean
}

export type CalendarConfig = {
  storageMode: StorageMode
  apiBaseUrl: string
  apiTimeoutMs: number
  features: CalendarFeatures
}

export const DEFAULT_CONFIG: CalendarConfig = {
  storageMode: 'local',
  apiBaseUrl: '/api',
  apiTimeoutMs: 10_000,
  features: { auth: false, teams: true },
}
