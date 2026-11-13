export const CATEGORY_NAME_MAX_LENGTH = 40
export const MAX_CATEGORIES = 30
export const MAX_EVENT_CATEGORIES = 5

export type Category = { id: string; calendarId: string; name: string }

export const UNCATEGORIZED = ''

export type CategoryFilter = ReadonlySet<string> | null

const text = (value: unknown) => (typeof value === 'string' ? value : '')

export const parseCategory = (value: unknown): Category | null => {
  if (typeof value !== 'object' || value === null) return null
  const { id, calendarId, name } = value as Record<string, unknown>
  const trimmed = text(name).trim().slice(0, CATEGORY_NAME_MAX_LENGTH)
  return text(id) && text(calendarId) && trimmed ? { id: text(id), calendarId: text(calendarId), name: trimmed } : null
}

export const parseCategories = (value: unknown): Category[] =>
  Array.isArray(value) ? value.flatMap((entry) => parseCategory(entry) ?? []) : []

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
) => {
  if (filter === null) return true
  const own = categoryIds.filter((id) => known.has(id))
  return own.length === 0 ? filter.has(UNCATEGORIZED) : own.some((id) => filter.has(id))
}

export const toggleCategoryFilter = (filter: CategoryFilter, all: readonly string[], id: string): CategoryFilter => {
  const next = new Set(filter ?? all)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return all.every((entry) => next.has(entry)) ? null : next
}
