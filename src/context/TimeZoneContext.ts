import { createContext, use } from 'react'
import { getBrowserTimeZone } from '../utils/timeZone.ts'
import { useHost } from './HostContext.ts'

export const TimeZoneContext = createContext<string | null>(null)

export const useAutomaticTimeZone = () => useHost().timeZone ?? getBrowserTimeZone()

export const useViewerTimeZone = () => {
  const chosen = use(TimeZoneContext)
  const automatic = useAutomaticTimeZone()
  return chosen ?? automatic
}
