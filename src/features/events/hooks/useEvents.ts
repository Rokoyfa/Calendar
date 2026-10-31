import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../../utils/error.ts'
import {
  applyToSeries,
  compareEvents,
  detachOccurrence,
  excludeOccurrence,
  type CalendarEvent,
  type EditScope,
  type EventInput,
  type EventOccurrence,
} from '../../../utils/event.ts'
import { useEventRepository, type DateRange } from '../../storage/index.ts'

type EventsState = {
  key: string
  events: CalendarEvent[]
  error: string | null
}

const INITIAL_STATE: EventsState = { key: '', events: [], error: null }

export function useEvents({ from, to }: DateRange) {
  const repository = useEventRepository()
  const [version, setVersion] = useState(0)
  const [state, setState] = useState(INITIAL_STATE)
  const key = `${from}|${to}|${version}`

  useEffect(() => {
    let cancelled = false

    repository
      .list({ from, to })
      .then((events) => {
        if (!cancelled) setState({ key, events: events.toSorted(compareEvents), error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState((previous) => ({ ...previous, key, error: getErrorMessage(error) }))
      })

    return () => {
      cancelled = true
    }
  }, [repository, from, to, key])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  const createEvent = useCallback(
    async (input: EventInput) => {
      const event = await repository.create(input)
      reload()
      return event
    },
    [repository, reload],
  )

  const findSeries = useCallback(
    (occurrence: EventOccurrence) => {
      const series = state.events.find((event) => event.id === occurrence.id)
      if (!series) throw new Error('Der Termin wurde nicht gefunden.')
      return series
    },
    [state.events],
  )

  const updateEvent = useCallback(
    async (occurrence: EventOccurrence, input: EventInput, scope: EditScope) => {
      const series = findSeries(occurrence)
      if (series.recurrence && scope === 'single') {
        await repository.update(series.id, excludeOccurrence(series, occurrence.startDate))
        await repository.create(detachOccurrence(input))
      } else if (series.recurrence) {
        await repository.update(series.id, applyToSeries(series, occurrence.startDate, input))
      } else {
        await repository.update(series.id, input)
      }
      reload()
    },
    [repository, reload, findSeries],
  )

  const deleteEvent = useCallback(
    async (occurrence: EventOccurrence, scope: EditScope) => {
      const series = findSeries(occurrence)
      if (series.recurrence && scope === 'single')
        await repository.update(series.id, excludeOccurrence(series, occurrence.startDate))
      else await repository.remove(series.id)
      reload()
    },
    [repository, reload, findSeries],
  )

  return {
    events: state.events,
    error: state.error,
    isLoading: state.key !== key,
    reload,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
