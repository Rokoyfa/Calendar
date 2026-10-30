import { useCallback, useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from '../../../utils/error.ts'
import { compareEvents, groupEventsByDate, type CalendarEvent, type EventInput } from '../../../utils/event.ts'
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

  const updateEvent = useCallback(
    async (id: string, input: EventInput) => {
      const event = await repository.update(id, input)
      reload()
      return event
    },
    [repository, reload],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      await repository.remove(id)
      reload()
    },
    [repository, reload],
  )

  const eventsByDate = useMemo(() => groupEventsByDate(state.events), [state.events])

  return {
    events: state.events,
    eventsByDate,
    error: state.error,
    isLoading: state.key !== key,
    reload,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
