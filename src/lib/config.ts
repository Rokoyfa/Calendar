import type { CSSProperties, Ref } from 'react'
import type { CalendarState } from '../context/HostBridge.ts'
import type { CalendarDataSource } from '../data/index.ts'
import type { UserTokenProvider } from '../features/authorization/index.ts'
import type { EventCallbacks } from './eventCallbacks.ts'
import type { CalendarHandle } from './handle.ts'
import type { CalendarOptions } from './options.ts'
import type { CalendarConfigSource } from './useCalendarOptions.ts'

export { DEFAULT_CONFIG, DEFAULT_FEATURES, FEATURE_NAMES, HOLIDAY_SOURCES, STORAGE_MODES } from './defaults.ts'
export type { CalendarFeature, CalendarFeatures, HolidaySource, StorageMode } from './defaults.ts'
export { DENSITIES, HOST_THEMES, OPTION_NAMES, ROUTING_MODES, parseCalendarOptions } from './options.ts'
export type { CalendarAppearance, CalendarOptions, CalendarRouting, ParsedOptions } from './options.ts'
export type { CalendarConfigSource } from './useCalendarOptions.ts'
export type { CalendarHandle } from './handle.ts'
export type { CalendarState, NewEventDraft } from '../context/HostBridge.ts'

export type CalendarProps = EventCallbacks &
  CalendarOptions & {
    config?: CalendarConfigSource
    ref?: Ref<CalendarHandle>
    onViewChange?: (state: CalendarState) => void
    dataSource?: CalendarDataSource
    getUserToken?: UserTokenProvider
    className?: string
    style?: CSSProperties
  }
