import { toEventInput, type CalendarEvent } from '../../../utils/event.ts'
import type { EventRepository } from '../../storage/index.ts'

type Change =
  | { type: 'created'; event: CalendarEvent }
  | { type: 'updated'; before: CalendarEvent }
  | { type: 'removed'; before: CalendarEvent }

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
    update: async (id, input) => {
      const before = previous(id)
      const updated = await repository.update(id, input)
      if (before) changes.push({ type: 'updated', before })
      byId.set(id, updated)
      return updated
    },
    remove: async (id) => {
      const before = previous(id)
      await repository.remove(id)
      if (before) changes.push({ type: 'removed', before })
      byId.delete(id)
    },
  }

  const undo = (): Undo | null => (complete && changes.length > 0 ? () => undoChanges(repository, changes) : null)

  return { repository: recording, undo }
}

async function undoChanges(repository: EventRepository, changes: readonly Change[]) {
  const replacedIds = new Map<string, string>()
  const currentId = (id: string) => replacedIds.get(id) ?? id
  const restore = (event: CalendarEvent) => ({
    ...toEventInput(event),
    seriesId: event.seriesId === null ? null : currentId(event.seriesId),
  })

  for (const change of changes.toReversed()) {
    if (change.type === 'created') await repository.remove(currentId(change.event.id))
    else if (change.type === 'updated') await repository.update(currentId(change.before.id), restore(change.before))
    else {
      const recreated = await repository.create(change.before.calendarId, restore(change.before))
      replacedIds.set(change.before.id, recreated.id)
    }
  }
}
