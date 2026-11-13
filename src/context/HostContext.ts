import { createContext, use } from 'react'
import { DEFAULT_FEATURES, type CalendarFeatures } from '../lib/defaults.ts'
import { CALENDAR_VIEWS, type CalendarView } from '../utils/calendarView.ts'
import type { HostBridge } from './HostBridge.ts'

export type HostTheme = 'light' | 'dark'

export type HostLinks = { routing: 'memory' | 'browser'; basename?: string; linkParam: string | false }

export type HostOptions = {
  features: CalendarFeatures
  views: readonly CalendarView[]
  readOnly?: boolean
  bridge?: HostBridge
  links?: HostLinks
  theme?: HostTheme
  initialView?: CalendarView
  timeZone?: string
  holidays?: string
  mapUrl?: string
}

export const HostContext = createContext<HostOptions>({
  features: DEFAULT_FEATURES,
  views: CALENDAR_VIEWS,
})

export const useHost = () => use(HostContext)

export const useFeatures = () => use(HostContext).features
