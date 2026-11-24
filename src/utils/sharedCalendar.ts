import type { HostLinks } from '../context/HostContext.ts'
import { buildHostLink } from './hostLink.ts'
import { parseCategories, type Category } from './category.ts'
import { isEventColor, type EventColor } from './event.ts'

export const SHARED_PATH = '/shared'

export type SharedCalendar = {
  id: string
  name: string
  color: EventColor
  categories: Category[]
}

export const parseSharedCalendar = (value: unknown): SharedCalendar | null => {
  if (typeof value !== 'object' || value === null) return null
  const { id, name, color, categories } = value as Record<string, unknown>
  if (typeof id !== 'string' || id === '' || typeof name !== 'string') return null
  return { id, name, color: isEventColor(color) ? color : 'blue', categories: parseCategories(categories) }
}

export const getSharedPath = (token: string) => `${SHARED_PATH}/${encodeURIComponent(token)}`

export const buildSharedLink = (token: string, links: HostLinks | undefined, pageUrl: string) =>
  buildHostLink(getSharedPath(token), links, pageUrl)
