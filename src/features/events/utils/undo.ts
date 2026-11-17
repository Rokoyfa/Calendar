import { isApiError } from '../../../utils/apiError.ts'
import { isAppError } from '../../../utils/appError.ts'
import { toEventInput, type CalendarEvent } from '../../../utils/event.ts'
import type { EventRepository } from '../../storage/index.ts'

type Change =
  | { type: 'created'; event: CalendarEvent }
  | { type: 'updated'; before: CalendarEvent }
  | { type: 'removed'; before: CalendarEvent }

const isMissing = (error: unknown) =>
  (isApiError(error) && (error.status === 404 || error.status === 405 || error.status === 501)) ||
  (isAppError(error) && error.code === 'eventNotFound')

const restoreFromTrash = async (repository: EventRepository, id: string) => {
  if (!repository.restore) return null
  try {
    return await repository.restore(id)
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

export type Undo = () => Promise<void>

export function recordChanges(repository: EventRepository, known: readonly CalendarEvent[]) {
  const byId = new Map(known.map((event) => [event.id, event]))
  const changes: Change[] = []
  let complete = true

  const previous = (id: string) => {
    const before = byId.get(id)
    if (!before) complete = false
    return before
  }

  const recording: EventRepository = {
    list: (query) => repository.list(query),
    listSeries: async (seriesId) => {
      const events = await repository.listSeries(seriesId)
      for (const event of events) byId.set(event.id, event)
      return events
    },
    create: async (calendarId, input) => {
      const created = await repository.create(calendarId, input)
      changes.push({ type: 'created', event: created })
      byId.set(created.id, created)
      return created
    },
    update: async (id, input, version) => {
      const before = previous(id)
      const updated = await repository.update(id, input, version)
      if (before) changes.push({ type: 'updated', before })
      byId.set(id, updated)
      return updated
    },
    remove: async (id, version) => {
      const before = previous(id)
      await repository.remove(id, version)
      if (before) changes.push({ type: 'removed', before })
      byId.delete(id)
    },
  }

  const undo = (): Undo | null => {
    if (!complete || changes.length === 0) return null
    const versions = new Map([...byId].map(([id, event]) => [id, event.version]))
    return () => undoChanges(repository, changes, versions)
  }

  return { repository: recording, undo }
}

async function undoChanges(repository: EventRepository, changes: readonly Change[], versions: Map<string, number>) {
  const replacedIds = new Map<string, string>()
  const currentId = (id: string) => replacedIds.get(id) ?? id
  const restore = (event: CalendarEvent) => ({
    ...toEventInput(event),
    seriesId: event.seriesId === null ? null : currentId(event.seriesId),
  })

  for (const change of changes.toReversed()) {
    if (change.type === 'created') {
      const id = currentId(change.event.id)
      await repository.remove(id, versions.get(id))
    } else if (change.type === 'updated') {
      const id = currentId(change.before.id)
      const restored = await repository.update(id, restore(change.before), versions.get(id))
      versions.set(id, restored.version)
    } else {
      const restored = await restoreFromTrash(repository, change.before.id)
      if (restored) {
        versions.set(restored.id, restored.version)
        continue
      }
      const recreated = await repository.create(change.before.calendarId, restore(change.before))
      replacedIds.set(change.before.id, recreated.id)
      versions.set(recreated.id, recreated.version)
    }
  }
}
