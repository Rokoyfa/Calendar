import { createContext, use } from 'react'
import { DEFAULT_FEATURES, type CalendarFeatures } from '../lib/defaults.ts'
import { CALENDAR_VIEWS, type CalendarView } from '../utils/calendarView.ts'

export type HostTheme = 'light' | 'dark'

export type HostOptions = {
  features: CalendarFeatures
  views: readonly CalendarView[]
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
