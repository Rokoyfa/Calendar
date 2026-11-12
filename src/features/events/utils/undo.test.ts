import { describe, expect, it } from 'vitest'
import { calendarEvent, recurrence } from '../../../test/fixtures.ts'
import type { CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { EventRepository } from '../../storage/index.ts'
import { deleteOccurrence, updateOccurrence } from './seriesActions.ts'
import { recordChanges } from './undo.ts'

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
})
