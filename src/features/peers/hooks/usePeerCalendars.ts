import { use } from 'react'
import { PeerCalendarsContext } from '../context/PeerCalendarsContext.ts'

export const usePeerCalendars = () => use(PeerCalendarsContext)
