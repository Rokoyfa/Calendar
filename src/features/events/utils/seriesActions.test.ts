import { describe, expect, it } from 'vitest'
import { calendarEvent, eventInput, recurrence } from '../../../test/fixtures.ts'
import { createMemoryEventRepository } from '../../../test/memoryEventRepository.ts'
import { deleteOccurrence, updateOccurrence } from './seriesActions.ts'

const setup = () => {
  const series = calendarEvent({ id: 's', recurrence: recurrence(), startDate: '2026-11-02', endDate: '2026-11-02' })
  const detached = calendarEvent({
    id: 'd',
    title: 'Moved',
    startDate: '2026-11-06',
    endDate: '2026-11-06',
    seriesId: 's',
    originalDate: '2026-11-06',
  })
  return { series, ...createMemoryEventRepository([series, detached]) }
}

const edit = (overrides = {}) =>
  eventInput({ title: 'Edited', startDate: '2026-11-04', endDate: '2026-11-04', recurrence: recurrence(), ...overrides })

describe('series actions', () => {
  it('detaches a single occurrence', async () => {
    const { series, repository, events, calls } = setup()
    await updateOccurrence(repository, series, '2026-11-04', edit({ recurrence: null }), 'single')
    expect(calls).toEqual(['update s', 'create new-1'])
    expect(events.get('s')?.excludedDates).toEqual(['2026-11-04'])
    expect(events.get('new-1')).toMatchObject({ seriesId: 's', originalDate: '2026-11-04', recurrence: null })
  })

  it('splits the series for this and following occurrences and relinks detached ones', async () => {
    const { series, repository, events } = setup()
    await updateOccurrence(repository, series, '2026-11-04', edit(), 'following')
    expect(events.get('s')?.recurrence?.until).toBe('2026-11-03')
    expect(events.get('new-1')).toMatchObject({ title: 'Edited', startDate: '2026-11-04' })
    expect(events.get('d')).toMatchObject({ seriesId: 'new-1', originalDate: '2026-11-06' })
  })

  it('treats following from the first occurrence as all', async () => {
    const { series, repository, calls } = setup()
    await updateOccurrence(repository, series, '2026-11-02', edit({ startDate: '2026-11-02', endDate: '2026-11-02' }), 'following')
    expect(calls).toEqual(['update s'])
  })

  it('deletes this and following occurrences including detached ones', async () => {
    const { series, repository, events } = setup()
    await deleteOccurrence(repository, series, '2026-11-05', 'following')
    expect(events.get('s')?.recurrence?.until).toBe('2026-11-04')
    expect(events.has('d')).toBe(false)
  })

  it('deletes the whole series', async () => {
    const { series, repository, events, calls } = setup()
    await deleteOccurrence(repository, series, '2026-11-04', 'all')
    expect(calls).toEqual(['remove d', 'remove s'])
    expect(events.size).toBe(0)
  })
})
