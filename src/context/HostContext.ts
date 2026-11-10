import { createContext, use } from 'react'
import type { CalendarView } from '../utils/calendarView.ts'

export type HostTheme = 'light' | 'dark'

export type HostOptions = {
  teams: boolean
  theme?: HostTheme
  initialView?: CalendarView
}

export const HostContext = createContext<HostOptions>({ teams: true })

export const useHost = () => use(HostContext)
