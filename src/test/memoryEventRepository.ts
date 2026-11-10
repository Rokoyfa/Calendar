import type { EventRepository } from '../features/storage/index.ts'
import type { CalendarEvent } from '../utils/event.ts'

export function createMemoryEventRepository(initial: CalendarEvent[] = []) {
  const events = new Map(initial.map((event) => [event.id, event]))
  const calls: string[] = []
  let nextId = 1

  const repository: EventRepository = {
    list: async ({ calendarIds }) => [...events.values()].filter((event) => calendarIds.includes(event.calendarId)),
    listSeries: async (seriesId) =>
      [...events.values()].filter((event) => event.id === seriesId || event.seriesId === seriesId),
    create: async (calendarId, input) => {
      const event: CalendarEvent = { ...input, id: `new-${nextId++}`, calendarId, createdAt: '', updatedAt: '' }
      events.set(event.id, event)
      calls.push(`create ${event.id}`)
      return event
    },
    update: async (id, input) => {
      const existing = events.get(id)
      if (!existing) throw new Error(`missing ${id}`)
      const event = { ...existing, ...input }
      events.set(id, event)
      calls.push(`update ${id}`)
      return event
    },
    remove: async (id) => {
      events.delete(id)
      calls.push(`remove ${id}`)
    },
  }

  return { repository, events, calls }
}
