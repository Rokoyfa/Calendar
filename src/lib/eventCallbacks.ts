import type { EventRepository } from '../features/storage/index.ts'
import type { CalendarEvent } from '../utils/event.ts'

export type DeletedEvent = { id: string }

export type EventCallbacks = {
  onEventCreate?: (event: CalendarEvent) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventDelete?: (event: DeletedEvent) => void
}

export const withEventCallbacks = (
  repository: EventRepository,
  getCallbacks: () => EventCallbacks,
): EventRepository => ({
  list: (query) => repository.list(query),
  listSeries: (seriesId) => repository.listSeries(seriesId),
  search: repository.search && ((query) => repository.search!(query)),
  respond:
    repository.respond &&
    (async (id, status) => {
      const event = await repository.respond!(id, status)
      getCallbacks().onEventUpdate?.(event)
      return event
    }),
  subscribe: repository.subscribe && ((listener) => repository.subscribe!(listener)),
  setReminders: repository.setReminders && ((id, reminders) => repository.setReminders!(id, reminders)),
  async create(calendarId, input) {
    const event = await repository.create(calendarId, input)
    getCallbacks().onEventCreate?.(event)
    return event
  },
  async update(id, input, version) {
    const event = await repository.update(id, input, version)
    getCallbacks().onEventUpdate?.(event)
    return event
  },
  async remove(id, version) {
    await repository.remove(id, version)
    getCallbacks().onEventDelete?.({ id })
  },
})
