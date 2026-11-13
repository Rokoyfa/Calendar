import type { CSSProperties } from 'react'
import type { CalendarDataSource } from '../data/index.ts'
import type { UserTokenProvider } from '../features/authorization/index.ts'
import type { EventCallbacks } from './eventCallbacks.ts'
import type { CalendarOptions } from './options.ts'
import type { CalendarConfigSource } from './useCalendarOptions.ts'

export { DEFAULT_CONFIG, DEFAULT_FEATURES, FEATURE_NAMES, HOLIDAY_SOURCES, STORAGE_MODES } from './defaults.ts'
export type { CalendarFeature, CalendarFeatures, HolidaySource, StorageMode } from './defaults.ts'
export { HOST_THEMES, OPTION_NAMES, ROUTING_MODES, parseCalendarOptions } from './options.ts'
export type { CalendarOptions, CalendarRouting, ParsedOptions } from './options.ts'
export type { CalendarConfigSource } from './useCalendarOptions.ts'

export type CalendarProps = EventCallbacks &
  CalendarOptions & {
    config?: CalendarConfigSource
    dataSource?: CalendarDataSource
    getUserToken?: UserTokenProvider
    className?: string
    style?: CSSProperties
  }
