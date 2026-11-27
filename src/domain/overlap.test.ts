import { describe, expect, it } from 'vitest'
import { calendarEvent } from '../test/fixtures.ts'
import { findOverlaps } from './overlap.ts'

const event = (id: string, start: string, end: string, extra = {}) =>
  calendarEvent({ id, uid: id, startDate: '2026-11-23', endDate: '2026-11-23', start, end, ...extra })

describe('findOverlaps', () => {
  const input = event('new', '10:00', '11:00')

  it('finds timed events that overlap', () => {
    const found = findOverlaps(
      input,
      [event('a', '09:00', '10:00'), event('b', '10:30', '12:00'), event('c', '11:00', '12:00')],
      null,
      null,
    )
    expect(found.map(({ id }) => id)).toEqual(['b'])
  })

  it('ignores all-day events, the event itself and declined events', () => {
    const found = findOverlaps(
      input,
      [
        event('d', '00:00', '00:00', { allDay: true }),
        event('e', '10:00', '11:00', { uid: 'new' }),
        event('f', '10:00', '11:00', { attendees: [{ email: 'me@x.de', name: 'Me', status: 'declined' }] }),
      ],
      null,
      'me@x.de',
    )
    expect(found).toEqual([])
  })

  it('compares in the viewer time zone and finds series occurrences', () => {
    const series = event('s', '09:30', '10:30', {
      startDate: '2026-11-16',
      endDate: '2026-11-16',
      timeZone: 'Europe/London',
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        weekdays: [0],
        monthlyMode: 'dayOfMonth',
        until: null,
        count: null,
        rule: null,
        dates: [],
      },
    })
    const zoned = { ...input, timeZone: 'Europe/Berlin' }
    expect(findOverlaps(zoned, [series], 'Europe/Berlin', null).map(({ occurrenceDate }) => occurrenceDate)).toEqual([
      '2026-11-23',
    ])
  })
})
