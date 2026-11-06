import { useCallback } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { AppError } from '../../../utils/appError.ts'
import {
  type CalendarEvent,
  type EditScope,
  type EventInput,
  type EventOccurrence,
} from '../../../utils/event.ts'
import { useStorage, type EventQuery } from '../../storage/index.ts'
import { deleteOccurrence, updateOccurrence } from '../utils/seriesActions.ts'

const NO_EVENTS: CalendarEvent[] = []

type UseEventsOptions = EventQuery & { targetCalendarId: string }

export function useEvents({ from, to, calendarIds, targetCalendarId }: UseEventsOptions) {
  const { events: repository, version } = useStorage()
  const load = useCallback(() => repository.list({ from, to, calendarIds }), [repository, from, to, calendarIds])
  const { data: events, error, isLoading, reload } = useAsyncResource(load, NO_EVENTS, version)

  const findSeries = useCallback(
    (occurrence: EventOccurrence) => {
      const series = events.find((event) => event.id === occurrence.id)
      if (!series) throw new AppError('eventNotFound')
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
    (input: EventInput) => withReload(() => repository.create(targetCalendarId, input)),
    [repository, withReload, targetCalendarId],
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
