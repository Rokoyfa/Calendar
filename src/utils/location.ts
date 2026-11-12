import { isWebUrl } from './event.ts'

export const QUERY_PLACEHOLDER = '{query}'
export const DEFAULT_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${QUERY_PLACEHOLDER}`

export const isMapUrlTemplate = (value: unknown): value is string =>
  typeof value === 'string' && value.includes(QUERY_PLACEHOLDER) && isWebUrl(value.replace(QUERY_PLACEHOLDER, 'x'))

export const getLocationUrl = (location: string, template = DEFAULT_MAP_URL) => {
  const query = location.trim()
  if (!query) return null
  if (isWebUrl(query)) return query
  return template.replace(QUERY_PLACEHOLDER, encodeURIComponent(query))
}
