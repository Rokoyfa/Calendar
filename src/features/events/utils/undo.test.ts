import { describe, expect, it, vi } from 'vitest'
import { calendarEvent, recurrence } from '../../../test/fixtures.ts'
import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { EventRepository } from '../../storage/index.ts'
import { deleteOccurrence, updateOccurrence } from './seriesActions.ts'
import { recordChanges } from './undo.ts'
import { AppError } from '../../../utils/appError.ts'
import { ApiError } from '../../../utils/apiError.ts'

const memoryRepository = (initial: CalendarEvent[]) => {
  let events = [...initial]
  let nextId = 1
  const repository: EventRepository = {
    list: async () => events,
    listSeries: async (seriesId) => events.filter((event) => event.id === seriesId || event.seriesId === seriesId),
    create: async (calendarId, input: EventInput) => {
      const created = { ...calendarEvent(), ...input, id: `new-${nextId++}`, calendarId }
      events.push(created)
      return created
    },
    update: async (id, input) => {
      const updated = { ...events.find((event) => event.id === id)!, ...input }
      events = events.map((event) => (event.id === id ? updated : event))
      return updated
    },
    remove: async (id) => {
      events = events.filter((event) => event.id !== id)
    },
  }
  return { repository, all: () => events }
}

const strip = (events: CalendarEvent[]) =>
  events.map(({ title, startDate, start, excludedDates, recurrence: rule, seriesId }) => ({
    title,
    startDate,
    start,
    excludedDates,
    recurring: rule !== null,
    linked: seriesId !== null,
  }))

describe('undo', () => {
  it('restores a deleted series together with its detached events', async () => {
    const series = calendarEvent({ id: 's', title: 'Serie', recurrence: recurrence(), excludedDates: ['2026-11-03'] })
    const detached = calendarEvent({
      id: 'd',
      title: 'Einzeln',
      startDate: '2026-11-03',
      endDate: '2026-11-03',
      seriesId: 's',
      originalDate: '2026-11-03',
    })
    const store = memoryRepository([series, detached])
    const before = strip(store.all())

    const recorder = recordChanges(store.repository, [series])
    await deleteOccurrence(recorder.repository, series, '2026-11-02', 'all')
    expect(store.all()).toEqual([])

    await recorder.undo()!()
    expect(strip(store.all())).toEqual(before)
    const [restoredSeries, restoredDetached] = store.all()
    expect(restoredDetached.seriesId).toBe(restoredSeries.id)
  })

  it('reverts moving a single occurrence of a series', async () => {
    const series = calendarEvent({ id: 's', title: 'Serie', recurrence: recurrence() })
    const store = memoryRepository([series])

    const recorder = recordChanges(store.repository, [series])
    await updateOccurrence(
      recorder.repository,
      series,
      '2026-11-04',
      { ...series, startDate: '2026-11-04', endDate: '2026-11-04', start: '15:00', end: '16:00' },
      'single',
    )
    expect(store.all()).toHaveLength(2)

    await recorder.undo()!()
    expect(store.all()).toEqual([series])
  })

  it('offers no undo when an earlier state is unknown', async () => {
    const event = calendarEvent({ id: 'x' })
    const store = memoryRepository([event])
    const recorder = recordChanges(store.repository, [])
    await recorder.repository.remove('x')
    expect(recorder.undo()).toBeNull()
  })

  it('does not overwrite a change someone else made after the action', async () => {
    const event = calendarEvent({ id: 'v', title: 'Alt', version: 1 })
    let stored = event
    const repository: EventRepository = {
      list: async () => [stored],
      listSeries: async () => [stored],
      create: async () => stored,
      update: async (_id, input, version) => {
        if (version !== undefined && version !== stored.version) throw new AppError('eventChanged')
        stored = { ...stored, ...input, version: stored.version + 1 }
        return stored
      },
      remove: async () => {},
    }
    const recorder = recordChanges(repository, [event])
    await recorder.repository.update('v', { ...event, title: 'Meins' }, event.version)
    stored = { ...stored, title: 'Fremd', version: stored.version + 1 }

    await expect(recorder.undo()!()).rejects.toMatchObject({ code: 'eventChanged' })
    expect(stored.title).toBe('Fremd')
  })

  it('restores a deleted event from the trash instead of creating a copy', async () => {
    const event = calendarEvent({ id: 'keep', title: 'Mit Anhang' })
    const trash = new Map<string, CalendarEvent>()
    const store = memoryRepository([event])
    const repository: EventRepository = {
      ...store.repository,
      remove: async (id) => {
        trash.set(
          id,
          store.all().find((entry) => entry.id === id)!,
        )
        await store.repository.remove(id)
      },
      restore: async (id) => {
        const restored = trash.get(id)!
        trash.delete(id)
        await store.repository.create(restored.calendarId, restored)
        return restored
      },
    }
    const create = vi.spyOn(store.repository, 'create')
    const recorder = recordChanges(repository, [event])
    await recorder.repository.remove('keep')
    await recorder.undo()!()
    expect(trash.size).toBe(0)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('creates a copy when the backend has no restore endpoint', async () => {
    const event = calendarEvent({ id: 'old', title: 'Ohne Papierkorb' })
    const store = memoryRepository([event])
    const repository: EventRepository = {
      ...store.repository,
      restore: async () => {
        throw ApiError.fromResponse(404, { code: 'notFound' })
      },
    }
    const recorder = recordChanges(repository, [event])
    await recorder.repository.remove('old')
    await recorder.undo()!()
    expect(store.all().map((entry) => entry.title)).toEqual(['Ohne Papierkorb'])
  })
})
