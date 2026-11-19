import { use } from 'react'
import { ExternalCalendarsContext } from '../context/ExternalCalendarsContext.ts'

export const useExternalCalendars = () => use(ExternalCalendarsContext)
