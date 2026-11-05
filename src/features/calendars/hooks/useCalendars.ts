import { useContext } from 'react'
import { CalendarsContext } from '../context/CalendarsContext.ts'

export function useCalendars() {
  const calendars = useContext(CalendarsContext)
  if (!calendars) throw new Error('useCalendars muss innerhalb von <CalendarsProvider> verwendet werden.')
  return calendars
}
