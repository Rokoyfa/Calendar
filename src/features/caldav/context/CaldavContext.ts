import { createContext } from 'react'
import type {
  CaldavAccount,
  CaldavAccountChanges,
  CaldavAccountInput,
  CaldavCalendar,
  CaldavCalendarChanges,
} from '../utils/caldav.ts'

export type CaldavCalendarEntry = CaldavCalendar & { accountId: string; accountName: string }

export type CaldavContextValue = {
  isAvailable: boolean
  accounts: readonly CaldavAccount[]
  calendars: readonly CaldavCalendarEntry[]
  isLoading: boolean
  error: string | null
  create: (input: CaldavAccountInput) => Promise<void>
  update: (id: string, changes: CaldavAccountChanges) => Promise<void>
  remove: (id: string) => Promise<void>
  sync: (id: string) => Promise<void>
  updateCalendar: (id: string, changes: CaldavCalendarChanges) => Promise<void>
}

const unavailable = () => Promise.resolve()

export const NO_CALDAV: CaldavContextValue = {
  isAvailable: false,
  accounts: [],
  calendars: [],
  isLoading: false,
  error: null,
  create: unavailable,
  update: unavailable,
  remove: unavailable,
  sync: unavailable,
  updateCalendar: unavailable,
}

export const CaldavContext = createContext<CaldavContextValue>(NO_CALDAV)
