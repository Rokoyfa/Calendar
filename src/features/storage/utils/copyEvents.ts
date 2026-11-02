import { NO_SERIES_LINK, toEventInput, type CalendarEvent } from '../../../utils/event.ts'
import type { EventRepository } from '../types/storage.ts'

const isDetached = (event: CalendarEvent) => event.seriesId !== null

export async function copyEvents(events: readonly CalendarEvent[], target: EventRepository) {
  const newIds = new Map<string, string>()
  const ordered = events.toSorted((a, b) => Number(isDetached(a)) - Number(isDetached(b)))

  for (const event of ordered) {
    const seriesId = event.seriesId === null ? undefined : newIds.get(event.seriesId)
    const created = await target.create({
      ...toEventInput(event),
      ...(seriesId ? { seriesId, originalDate: event.originalDate } : NO_SERIES_LINK),
    })
    newIds.set(event.id, created.id)
  }

  return ordered.length
}
