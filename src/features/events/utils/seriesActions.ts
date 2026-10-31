import { addDaysToISODate } from '../../../utils/date.ts'
import { toEventInput, type CalendarEvent, type EditScope, type EventInput } from '../../../utils/event.ts'
import {
  changeWholeSeries,
  continueSeries,
  detachOccurrence,
  excludeOccurrence,
  getShift,
  hasEarlierOccurrences,
  isDetachedFrom,
  truncateSeries,
} from '../../../utils/series.ts'
import type { EventRepository } from '../../storage/index.ts'

type ScopeHandlers = {
  plain: () => Promise<unknown>
  single: () => Promise<unknown>
  following: (detached: CalendarEvent[]) => Promise<unknown>
  all: (detached: CalendarEvent[]) => Promise<unknown>
}

async function applyScope(
  repository: EventRepository,
  series: CalendarEvent,
  occurrenceDate: string,
  requestedScope: EditScope,
  handlers: ScopeHandlers,
) {
  if (!series.recurrence) return handlers.plain()

  const scope =
    requestedScope === 'following' && !hasEarlierOccurrences(series, occurrenceDate) ? 'all' : requestedScope
  if (scope === 'single') return handlers.single()

  const detached = (await repository.listSeries(series.id)).filter((event) => event.seriesId === series.id)
  return handlers[scope](detached)
}

async function forEachInOrder<T>(items: readonly T[], action: (item: T) => Promise<unknown>) {
  for (const item of items) await action(item)
}

const relink = (event: CalendarEvent, seriesId: string | null, shift: number): EventInput => ({
  ...toEventInput(event),
  seriesId,
  originalDate: seriesId === null || event.originalDate === null ? null : addDaysToISODate(event.originalDate, shift),
})

export const updateOccurrence = (
  repository: EventRepository,
  series: CalendarEvent,
  occurrenceDate: string,
  input: EventInput,
  scope: EditScope,
) => {
  const shift = getShift(occurrenceDate, input)
  const relinkAll = (events: readonly CalendarEvent[], seriesId: string | null) =>
    forEachInOrder(events, (event) => repository.update(event.id, relink(event, seriesId, shift)))

  return applyScope(repository, series, occurrenceDate, scope, {
    plain: () => repository.update(series.id, input),
    single: async () => {
      await repository.update(series.id, excludeOccurrence(series, occurrenceDate))
      await repository.create(detachOccurrence(series, occurrenceDate, input))
    },
    following: async (detached) => {
      await repository.update(series.id, truncateSeries(series, occurrenceDate))
      const created = await repository.create(continueSeries(series, occurrenceDate, input))
      await relinkAll(
        detached.filter((event) => isDetachedFrom(event, occurrenceDate)),
        created.recurrence ? created.id : null,
      )
    },
    all: async (detached) => {
      await repository.update(series.id, changeWholeSeries(series, occurrenceDate, input))
      if (!input.recurrence) await relinkAll(detached, null)
      else if (shift !== 0) await relinkAll(detached, series.id)
    },
  })
}

export const deleteOccurrence = (
  repository: EventRepository,
  series: CalendarEvent,
  occurrenceDate: string,
  scope: EditScope,
) => {
  const removeAll = (events: readonly CalendarEvent[]) =>
    forEachInOrder(events, (event) => repository.remove(event.id))

  return applyScope(repository, series, occurrenceDate, scope, {
    plain: () => repository.remove(series.id),
    single: () => repository.update(series.id, excludeOccurrence(series, occurrenceDate)),
    following: async (detached) => {
      await repository.update(series.id, truncateSeries(series, occurrenceDate))
      await removeAll(detached.filter((event) => isDetachedFrom(event, occurrenceDate)))
    },
    all: async (detached) => {
      await removeAll(detached)
      await repository.remove(series.id)
    },
  })
}
