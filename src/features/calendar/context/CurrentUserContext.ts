import { createContext, use } from 'react'
import type { CalendarEvent } from '../../../utils/event.ts'

export const CurrentUserEmailContext = createContext<string | null>(null)

export const useOwnAttendance = ({ attendees }: Pick<CalendarEvent, 'attendees'>) => {
  const email = use(CurrentUserEmailContext)
  return email ? attendees.find((attendee) => attendee.email === email.toLowerCase())?.status : undefined
}
