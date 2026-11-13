import type { Messages } from '../../../i18n/index.ts'
import {
  hasValidationErrors,
  normalizeEventInput,
  validateEventInput,
  type CalendarEvent,
  type EventInput,
} from '../../../utils/event.ts'
import { MAX_CATEGORIES, MAX_EVENT_CATEGORIES, type Category } from '../../../utils/category.ts'
import type { ImportedEvent } from '../../../utils/ical.ts'
import type { EventRepository } from '../../storage/index.ts'

const ALL_TIME = { from: '1900-01-01', to: '9999-12-31' }

export const listAllEvents = (repository: EventRepository, calendarId: string) =>
  repository.list({ ...ALL_TIME, calendarIds: [calendarId] })

export type ImportSummary = { created: number; updated: number; skipped: number }

export type CategoryResolver = (names: readonly string[]) => Promise<string[]>

const NO_CATEGORIES: CategoryResolver = async () => []

export function createCategoryResolver(
  existing: readonly Category[],
  create: ((name: string) => Promise<Category>) | null,
): CategoryResolver {
  const byName = new Map(existing.map((category) => [category.name.toLocaleLowerCase(), category.id]))
  let room = MAX_CATEGORIES - existing.length
  return async (names) => {
    const ids: string[] = []
    for (const name of names) {
      const key = name.toLocaleLowerCase()
      let id = byName.get(key)
      if (id === undefined && create && room > 0) {
        try {
          id = (await create(name)).id
          room -= 1
          byName.set(key, id)
        } catch {
          id = undefined
        }
      }
      if (id !== undefined && !ids.includes(id)) ids.push(id)
    }
    return ids.slice(0, MAX_EVENT_CATEGORIES)
  }
}

const detachedKey = (seriesId: string, originalDate: string) => `${seriesId}|${originalDate}`

export async function importEvents(
  repository: EventRepository,
  calendarId: string,
  imported: readonly ImportedEvent[],
  m: Messages,
  resolveCategories: CategoryResolver = NO_CATEGORIES,
): Promise<ImportSummary> {
  const existing = await listAllEvents(repository, calendarId)
  const byUid = new Map(existing.filter((event) => event.seriesId === null).map((event) => [event.uid, event]))
  const detached = new Map(
    existing
      .filter((event) => event.seriesId !== null && event.originalDate !== null)
      .map((event) => [detachedKey(event.seriesId!, event.originalDate!), event]),
  )
  const summary: ImportSummary = { created: 0, updated: 0, skipped: 0 }
  const isValid = (input: EventInput) => !hasValidationErrors(validateEventInput(input, m))

  const save = async (
    { input, categoryNames }: Pick<ImportedEvent, 'input' | 'categoryNames'>,
    current: CalendarEvent | undefined,
  ) => {
    const categoryIds = categoryNames.length > 0 ? await resolveCategories(categoryNames) : (current?.categoryIds ?? [])
    const normalized = normalizeEventInput({ ...input, categoryIds })
    if (!isValid(normalized)) {
      summary.skipped += 1
      return null
    }
    const saved = current
      ? await repository.update(current.id, { ...normalized, color: current.color })
      : await repository.create(calendarId, normalized)
    summary[current ? 'updated' : 'created'] += 1
    return saved
  }

  const masters = imported.filter((event) => event.recurrenceId === null)
  const exceptions = imported.filter((event) => event.recurrenceId !== null)
  const savedByUid = new Map<string, CalendarEvent>()

  for (const { input, categoryNames } of masters) {
    const excluded = exceptions
      .filter((exception) => exception.input.uid === input.uid)
      .map((exception) => exception.recurrenceId!)
    const withExceptions = input.recurrence
      ? { ...input, excludedDates: [...new Set([...input.excludedDates, ...excluded])].sort() }
      : input
    const saved = await save({ input: withExceptions, categoryNames }, byUid.get(input.uid))
    if (saved) savedByUid.set(input.uid, saved)
  }

  for (const { input, recurrenceId, categoryNames } of exceptions) {
    const series = savedByUid.get(input.uid) ?? byUid.get(input.uid)
    if (!series?.recurrence) {
      summary.skipped += 1
      continue
    }
    await save(
      { input: { ...input, recurrence: null, seriesId: series.id, originalDate: recurrenceId }, categoryNames },
      detached.get(detachedKey(series.id, recurrenceId!)),
    )
  }

  return summary
}
