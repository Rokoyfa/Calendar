import type { CSSProperties } from 'react'
import type { CalendarDataSource } from '../data/index.ts'
import type { HostTheme } from '../context/HostContext.ts'
import type { UserTokenProvider } from '../features/authorization/index.ts'
import type { CalendarView } from '../utils/calendarView.ts'
import type { EventCallbacks } from './eventCallbacks.ts'
import type { CalendarFeatures, StorageMode } from './defaults.ts'

export { DEFAULT_CONFIG, STORAGE_MODES } from './defaults.ts'
export type { CalendarConfig, CalendarFeatures, StorageMode } from './defaults.ts'

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
  theme?: HostTheme
  initialView?: CalendarView
  timeZone?: string
  className?: string
  style?: CSSProperties
}
