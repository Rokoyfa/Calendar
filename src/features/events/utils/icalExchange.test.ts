import { describe, expect, it } from 'vitest'
import { en } from '../../../i18n/messages/en/index.ts'
import { createMemoryEventRepository } from '../../../test/memoryEventRepository.ts'
import { calendarEvent, eventInput, recurrence } from '../../../test/fixtures.ts'
import { importEvents } from './icalExchange.ts'

describe('importEvents', () => {
  it('creates new events, updates known uids and attaches exceptions to their series', async () => {
    const known = calendarEvent({ id: 'known', uid: 'known-uid', title: 'Old', color: 'red' })
    const { repository, events, calls } = createMemoryEventRepository([known])
    const summary = await importEvents(
      repository,
      'personal',
      [
        { recurrenceId: null, input: eventInput({ uid: 'known-uid', title: 'New title' }) },
        { recurrenceId: null, input: eventInput({ uid: 'series', title: 'Series', recurrence: recurrence() }) },
        { recurrenceId: '2026-11-04', input: eventInput({ uid: 'series', title: 'Moved', startDate: '2026-11-04', endDate: '2026-11-04', start: '12:00', end: '13:00' }) },
        { recurrenceId: null, input: eventInput({ uid: 'bad', title: '', startDate: 'x' }) },
      ],
      en,
    )
    expect(summary).toEqual({ created: 2, updated: 1, skipped: 1 })
    expect(events.get('known')).toMatchObject({ title: 'New title', color: 'red' })
    const series = [...events.values()].find((event) => event.uid === 'series' && event.recurrence)
    expect(series?.excludedDates).toEqual(['2026-11-04'])
    expect([...events.values()].find((event) => event.seriesId === series?.id)).toMatchObject({ originalDate: '2026-11-04', title: 'Moved' })
    expect(calls).toEqual(['update known', 'create new-1', 'create new-2'])
  })
})
