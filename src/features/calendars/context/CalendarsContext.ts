import { createContext } from 'react'
import type { CalendarsContextValue } from '../types/calendar.ts'

export const CalendarsContext = createContext<CalendarsContextValue | null>(null)
