import { useCallback } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import {
  EVENT_NOT_FOUND_MESSAGE,
  type CalendarEvent,
  type EditScope,
  type EventInput,
  type EventOccurrence,
} from '../../../utils/event.ts'
import { useEventRepository, type DateRange } from '../../storage/index.ts'
import { deleteOccurrence, updateOccurrence } from '../utils/seriesActions.ts'

const NO_EVENTS: CalendarEvent[] = []

export function useEvents({ from, to }: DateRange) {
  const repository = useEventRepository()
  const load = useCallback(() => repository.list({ from, to }), [repository, from, to])
  const { data: events, error, isLoading, reload } = useAsyncResource(load, NO_EVENTS)

  const findSeries = useCallback(
    (occurrence: EventOccurrence) => {
      const series = events.find((event) => event.id === occurrence.id)
      if (!series) throw new Error(EVENT_NOT_FOUND_MESSAGE)
      return series
    },
    [events],
  )

  const withReload = useCallback(
    async <T>(operation: () => Promise<T>) => {
      try {
        return await operation()
      } finally {
        reload()
      }
    },
    [reload],
  )

  const createEvent = useCallback(
    (input: EventInput) => withReload(() => repository.create(input)),
    [repository, withReload],
  )

  const updateEvent = useCallback(
    (occurrence: EventOccurrence, input: EventInput, scope: EditScope) =>
      withReload(() => updateOccurrence(repository, findSeries(occurrence), occurrence.startDate, input, scope)),
    [repository, withReload, findSeries],
  )

  const deleteEvent = useCallback(
    (occurrence: EventOccurrence, scope: EditScope) =>
      withReload(() => deleteOccurrence(repository, findSeries(occurrence), occurrence.startDate, scope)),
    [repository, withReload, findSeries],
  )

  return { events, error, isLoading, reload, createEvent, updateEvent, deleteEvent }
}
