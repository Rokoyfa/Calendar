import { useCallback } from 'react'
import { useHost } from '../context/HostContext.ts'
import { getLocationUrl } from '../utils/location.ts'

export const useLocationUrl = () => {
  const { mapUrl } = useHost()
  return useCallback((location: string) => getLocationUrl(location, mapUrl), [mapUrl])
}
