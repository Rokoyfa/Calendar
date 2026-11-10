export const DEFAULT_LINK_PARAM = 'calendarPath'

export const readLinkedPath = (param: string) => {
  if (typeof window === 'undefined') return undefined
  const path = new URLSearchParams(window.location.search).get(param)
  return path?.startsWith('/') && !path.startsWith('//') ? path : undefined
}
