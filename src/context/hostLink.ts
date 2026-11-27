import type { HostLinks } from './HostContext.ts'

export const buildHostLink = (path: string, links: HostLinks | undefined, pageUrl: string) => {
  if (!links || !URL.canParse(pageUrl)) return null
  const url = new URL(pageUrl)
  url.hash = ''
  if (links.routing === 'browser') {
    url.pathname = `${(links.basename ?? '').replace(/\/+$/, '')}${path}`
    url.search = ''
    return url.toString()
  }
  if (!links.linkParam) return null
  url.search = new URLSearchParams({ [links.linkParam]: path }).toString()
  return url.toString()
}
