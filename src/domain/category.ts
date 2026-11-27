import { parseList, textOrEmpty } from '../utils/parse.ts'
export const CATEGORY_NAME_MAX_LENGTH = 40
export const MAX_CATEGORIES = 30
export const MAX_EVENT_CATEGORIES = 5

export type Category = { id: string; calendarId: string; name: string }

export const UNCATEGORIZED = ''

export const BUILTIN_CATEGORIES = ['work', 'leisure', 'household', 'family', 'health', 'sport', 'learning'] as const

export type BuiltinCategory = (typeof BUILTIN_CATEGORIES)[number]

export const WORK_CATEGORY: BuiltinCategory = 'work'

const BUILTIN_FILTER_PREFIX = 'builtin:'

export const builtinFilterId = (category: BuiltinCategory) => `${BUILTIN_FILTER_PREFIX}${category}`

export const isBuiltinCategory = (value: unknown): value is BuiltinCategory =>
  (BUILTIN_CATEGORIES as readonly unknown[]).includes(value)

export const parseBuiltinCategories = (value: unknown): BuiltinCategory[] =>
  Array.isArray(value) ? BUILTIN_CATEGORIES.filter((category) => value.includes(category)) : []

export const isWorkCategorized = (builtinCategories: readonly BuiltinCategory[] | undefined) =>
  builtinCategories?.includes(WORK_CATEGORY) ?? false

export type CategoryFilter = ReadonlySet<string> | null

export const parseCategory = (value: unknown): Category | null => {
  if (typeof value !== 'object' || value === null) return null
  const { id, calendarId, name } = value as Record<string, unknown>
  const trimmed = textOrEmpty(name).trim().slice(0, CATEGORY_NAME_MAX_LENGTH)
  return textOrEmpty(id) && textOrEmpty(calendarId) && trimmed
    ? { id: textOrEmpty(id), calendarId: textOrEmpty(calendarId), name: trimmed }
    : null
}

export const parseCategories = (value: unknown): Category[] => parseList(value, parseCategory)

export const parseCategoryIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id !== ''))].slice(
        0,
        MAX_EVENT_CATEGORIES,
      )
    : []

export const normalizeCategoryName = (name: string) => name.trim().replace(/\s+/g, ' ')

export const isCategoryNameTaken = (
  categories: readonly Category[],
  calendarId: string,
  name: string,
  ownId?: string,
) =>
  categories.some(
    (category) =>
      category.calendarId === calendarId &&
      category.id !== ownId &&
      category.name.toLocaleLowerCase() === normalizeCategoryName(name).toLocaleLowerCase(),
  )

export const sortCategories = (categories: readonly Category[], locale?: string) =>
  [...categories].sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }))

export const matchesCategoryFilter = (
  categoryIds: readonly string[],
  known: ReadonlySet<string>,
  filter: CategoryFilter,
  builtinCategories: readonly BuiltinCategory[] = [],
) => {
  if (filter === null) return true
  const own = [...categoryIds.filter((id) => known.has(id)), ...builtinCategories.map(builtinFilterId)]
  return own.length === 0 ? filter.has(UNCATEGORIZED) : own.some((id) => filter.has(id))
}

export const toggleCategoryFilter = (filter: CategoryFilter, all: readonly string[], id: string): CategoryFilter => {
  const next = new Set(filter ?? all)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return all.every((entry) => next.has(entry)) ? null : next
}
