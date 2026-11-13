import { describe, expect, it } from 'vitest'
import { en } from '../../../i18n/messages/en/index.ts'
import { createMemoryEventRepository } from '../../../test/memoryEventRepository.ts'
import { calendarEvent, eventInput, recurrence } from '../../../test/fixtures.ts'
import { createCategoryResolver, importEvents } from './icalExchange.ts'

describe('importEvents', () => {
  it('creates new events, updates known uids and attaches exceptions to their series', async () => {
    const known = calendarEvent({ id: 'known', uid: 'known-uid', title: 'Old', color: 'red' })
    const { repository, events, calls } = createMemoryEventRepository([known])
    const summary = await importEvents(
      repository,
      'personal',
      [
        { recurrenceId: null, categoryNames: [], input: eventInput({ uid: 'known-uid', title: 'New title' }) },
        {
          recurrenceId: null,
          categoryNames: [],
          input: eventInput({ uid: 'series', title: 'Series', recurrence: recurrence() }),
        },
        {
          recurrenceId: '2026-11-04',
          categoryNames: [],
          input: eventInput({
            uid: 'series',
            title: 'Moved',
            startDate: '2026-11-04',
            endDate: '2026-11-04',
            start: '12:00',
            end: '13:00',
          }),
        },
        { recurrenceId: null, categoryNames: [], input: eventInput({ uid: 'bad', title: '', startDate: 'x' }) },
      ],
      en,
    )
    expect(summary).toEqual({ created: 2, updated: 1, skipped: 1 })
    expect(events.get('known')).toMatchObject({ title: 'New title', color: 'red' })
    const series = [...events.values()].find((event) => event.uid === 'series' && event.recurrence)
    expect(series?.excludedDates).toEqual(['2026-11-04'])
    expect([...events.values()].find((event) => event.seriesId === series?.id)).toMatchObject({
      originalDate: '2026-11-04',
      title: 'Moved',
    })
    expect(calls).toEqual(['update known', 'create new-1', 'create new-2'])
  })

  it('maps category names to ids, creating missing ones and keeping old ones when the file has none', async () => {
    const tagged = calendarEvent({ id: 'tagged', uid: 'tagged-uid', categoryIds: ['c1'] })
    const { repository, events } = createMemoryEventRepository([tagged])
    const created: string[] = []
    const resolve = createCategoryResolver([{ id: 'c1', calendarId: 'personal', name: 'Training' }], async (name) => {
      created.push(name)
      return { id: `new-${name}`, calendarId: 'personal', name }
    })
    await importEvents(
      repository,
      'personal',
      [
        { recurrenceId: null, categoryNames: [], input: eventInput({ uid: 'tagged-uid', title: 'Still tagged' }) },
        { recurrenceId: null, categoryNames: ['training', 'Spiel'], input: eventInput({ uid: 'a', title: 'A' }) },
        { recurrenceId: null, categoryNames: ['spiel'], input: eventInput({ uid: 'b', title: 'B' }) },
      ],
      en,
      resolve,
    )
    const byUid = (uid: string) => [...events.values()].find((event) => event.uid === uid)
    expect(byUid('tagged-uid')?.categoryIds).toEqual(['c1'])
    expect(byUid('a')?.categoryIds).toEqual(['c1', 'new-Spiel'])
    expect(byUid('b')?.categoryIds).toEqual(['new-Spiel'])
    expect(created).toEqual(['Spiel'])
  })

  it('drops unknown categories when it may not create them', async () => {
    const resolve = createCategoryResolver([{ id: 'c1', calendarId: 'personal', name: 'Training' }], null)
    expect(await resolve(['Neu', 'TRAINING'])).toEqual(['c1'])
  })

  it('stops creating at the category limit and survives failures', async () => {
    const existing = Array.from({ length: 29 }, (_, index) => ({ id: `c${index}`, calendarId: 'p', name: `K${index}` }))
    let calls = 0
    const resolve = createCategoryResolver(existing, async (name) => {
      calls += 1
      if (name === 'Kaputt') throw new Error('nope')
      return { id: `new-${name}`, calendarId: 'p', name }
    })
    expect(await resolve(['Kaputt', 'Eins', 'Zwei'])).toEqual(['new-Eins'])
    expect(calls).toBe(2)
  })
})
