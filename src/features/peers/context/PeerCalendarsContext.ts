import { createContext } from 'react'
import type { PeerCalendar, PeerCalendarChanges } from '../utils/peerCalendar.ts'

export type PeerCalendarsContextValue = {
  isAvailable: boolean
  calendars: readonly PeerCalendar[]
  invitations: readonly PeerCalendar[]
  error: string | null
  accept: (id: string) => Promise<void>
  decline: (id: string) => Promise<void>
  update: (id: string, changes: PeerCalendarChanges) => Promise<void>
  leave: (id: string) => Promise<void>
}

const unavailable = () => Promise.resolve()

export const NO_PEER_CALENDARS: PeerCalendarsContextValue = {
  isAvailable: false,
  calendars: [],
  invitations: [],
  error: null,
  accept: unavailable,
  decline: unavailable,
  update: unavailable,
  leave: unavailable,
}

export const PeerCalendarsContext = createContext<PeerCalendarsContextValue>(NO_PEER_CALENDARS)
