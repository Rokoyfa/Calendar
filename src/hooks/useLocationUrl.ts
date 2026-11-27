import { useCallback } from 'react'
import { useHost } from '../context/HostContext.ts'
import { getLocationUrl } from '../domain/location.ts'

export const useLocationUrl = () => {
  const { mapUrl, features } = useHost()
  const enabled = features.mapLinks
  return useCallback((location: string) => (enabled ? getLocationUrl(location, mapUrl) : null), [enabled, mapUrl])
}
