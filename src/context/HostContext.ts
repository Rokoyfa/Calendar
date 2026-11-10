import { createContext, use } from 'react'
import type { CalendarView } from '../utils/calendarView.ts'
import { getBrowserTimeZone } from '../utils/timeZone.ts'

export type HostTheme = 'light' | 'dark'

export type HostOptions = {
  teams: boolean
  theme?: HostTheme
  initialView?: CalendarView
  timeZone?: string
}

export const HostContext = createContext<HostOptions>({ teams: true })

export const useHost = () => use(HostContext)

export const useViewerTimeZone = () => useHost().timeZone ?? getBrowserTimeZone()
