type WithId = { id: string }

export const replaceById = <T extends WithId>(items: readonly T[], item: T): T[] =>
  items.map((entry) => (entry.id === item.id ? item : entry))

export const upsertById = <T extends WithId>(items: readonly T[], item: T): T[] =>
  items.some((entry) => entry.id === item.id) ? replaceById(items, item) : [...items, item]

export const removeById = <T extends WithId>(items: readonly T[], id: string): T[] =>
  items.filter((entry) => entry.id !== id)

export const compact = <T>(items: readonly (T | false | null | undefined)[]): T[] =>
  items.filter((item): item is T => item !== false && item !== null && item !== undefined)
