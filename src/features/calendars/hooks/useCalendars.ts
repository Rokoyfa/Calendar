import { useRequiredContext } from '../../../hooks/useRequiredContext.ts'
import { CalendarsContext } from '../context/CalendarsContext.ts'

export const useCalendars = () => useRequiredContext(CalendarsContext, 'CalendarsProvider')
