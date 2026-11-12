import type { MessageOverrides } from '../i18n/index.ts'
import type { CSSProperties } from 'react'
import type { CalendarDataSource } from '../data/index.ts'
import type { HostTheme } from '../context/HostContext.ts'
import type { UserTokenProvider } from '../features/authorization/index.ts'
import type { CalendarView } from '../utils/calendarView.ts'
import type { EventCallbacks } from './eventCallbacks.ts'
import type { CalendarFeatures, HolidaySource, StorageMode } from './defaults.ts'

export { DEFAULT_CONFIG, STORAGE_MODES } from './defaults.ts'
export { HOLIDAY_SOURCES } from './defaults.ts'
export type { CalendarFeatures, HolidaySource, StorageMode } from './defaults.ts'

export type CalendarRouting = 'memory' | 'browser'

export type CalendarProps = EventCallbacks & {
  dataSource?: CalendarDataSource
  tenant?: string
  getUserToken?: UserTokenProvider
  storageMode?: StorageMode
  apiBaseUrl?: string
  apiTimeoutMs?: number
  features?: Partial<CalendarFeatures>
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
  className?: string
  style?: CSSProperties
}
