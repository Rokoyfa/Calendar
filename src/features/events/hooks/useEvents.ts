import { useCallback, useMemo } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { AppError } from '../../../utils/appError.ts'
import { addDaysToISODate } from '../../../utils/date.ts'
import {
  ZONE_SHIFT_DAYS,
  type AttendeeStatus,
  type CalendarEvent,
  type EditScope,
  type EventInput,
  type EventOccurrence,
} from '../../../utils/event.ts'
import { useStorage, type EventQuery, type EventRepository } from '../../storage/index.ts'
import { deleteOccurrence, updateOccurrence } from '../utils/seriesActions.ts'
import { recordChanges, type Undo } from '../utils/undo.ts'

const NO_EVENTS: CalendarEvent[] = []

export type SaveOptions = { force?: boolean }

const ignoreVersions = (repository: EventRepository): EventRepository => ({
  list: (query) => repository.list(query),
  listSeries: (seriesId) => repository.listSeries(seriesId),
  create: (calendarId, input) => repository.create(calendarId, input),
  update: (id, input) => repository.update(id, input),
  remove: (id) => repository.remove(id),
  move: repository.move && ((id, calendarId) => repository.move!(id, calendarId)),
  restore: repository.restore && ((id) => repository.restore!(id)),
})

type UseEventsOptions = EventQuery & { targetCalendarId: string }

export function useEvents({ from, to, calendarIds, targetCalendarId }: UseEventsOptions) {
  const { events: repository, version, invalidate } = useStorage()
  const load = useCallback(
    async () =>
      calendarIds.length === 0
        ? NO_EVENTS
        : repository.list({
            from: addDaysToISODate(from, -ZONE_SHIFT_DAYS),
            to: addDaysToISODate(to, ZONE_SHIFT_DAYS),
            calendarIds,
          }),
    [repository, from, to, calendarIds],
  )
  const { data: events, error, isLoading } = useAsyncResource(load, NO_EVENTS, version)

  const findSeries = useCallback(
    (occurrence: EventOccurrence) => {
      const series = events.find((event) => event.id === occurrence.id)
      if (!series) throw new AppError('eventNotFound')
      return { ...series, version: occurrence.version }
    },
    [events],
  )

  const withReload = useCallback(
    async <T>(operation: () => Promise<T>) => {
      try {
        return await operation()
      } finally {
        invalidate()
      }
    },
    [invalidate],
  )

  const withUndo = useCallback(
    (operation: (repository: EventRepository) => Promise<unknown>, force = false) =>
      withReload(async (): Promise<Undo | null> => {
        const recorder = recordChanges(force ? ignoreVersions(repository) : repository, events)
        await operation(recorder.repository)
        const undo = recorder.undo()
        return undo && (() => withReload(undo))
      }),
    [repository, events, withReload],
  )

  const createEvent = useCallback(
    (input: EventInput, calendarId = targetCalendarId) => withReload(() => repository.create(calendarId, input)),
    [repository, withReload, targetCalendarId],
  )

  const moveEvent = useMemo(
    () =>
      repository.move &&
      ((occurrence: EventOccurrence, calendarId: string, checkVersion = true) =>
        withReload(async () => {
          const series = findSeries(occurrence)
          const from = series.calendarId
          const moved = await repository.move!(series.id, calendarId, checkVersion ? series.version : undefined)
          return {
            event: moved,
            undo: () =>
              withReload(async () => {
                await repository.move!(moved.id, from, moved.version)
              }),
          }
        })),
    [repository, withReload, findSeries],
  )

  const updateEvent = useCallback(
    (occurrence: EventOccurrence, input: EventInput, scope: EditScope, { force = false }: SaveOptions = {}) =>
      withUndo(
        (recording) => updateOccurrence(recording, findSeries(occurrence), occurrence.occurrenceDate, input, scope),
        force,
      ),
    [withUndo, findSeries],
  )

  const deleteEvent = useCallback(
    (occurrence: EventOccurrence, scope: EditScope) =>
      withUndo((recording) => deleteOccurrence(recording, findSeries(occurrence), occurrence.occurrenceDate, scope)),
    [withUndo, findSeries],
  )

  const respond = useMemo(
    () =>
      repository.respond &&
      ((occurrence: EventOccurrence, status: AttendeeStatus) =>
        withReload(async () => {
          await repository.respond!(occurrence.id, status)
        })),
    [repository, withReload],
  )

  const setReminders = useMemo(
    () =>
      repository.setReminders &&
      ((occurrence: EventOccurrence, reminders: number[]) =>
        withReload(async () => {
          await repository.setReminders!(occurrence.id, reminders)
        })),
    [repository, withReload],
  )

  return {
    events,
    error,
    isLoading,
    reload: invalidate,
    createEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    respond,
    setReminders,
  }
}
