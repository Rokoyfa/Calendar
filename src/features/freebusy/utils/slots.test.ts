import { describe, expect, it } from 'vitest'
import { combineFreeBusy, findCommonSlots, type SlotSearch } from './slots.ts'
import { parseFreeBusy } from './freeBusy.ts'

const at = (value: string) => Date.parse(value)

const base: SlotSearch = {
  durationMinutes: 60,
  fromDate: '2026-12-07',
  toDate: '2026-12-07',
  dayStart: '09:00',
  dayEnd: '12:00',
  includeWeekends: false,
  timeZone: 'UTC',
  now: at('2026-12-01T00:00:00Z'),
  busy: [],
  blockedDates: new Set(),
}

const starts = (search: Partial<SlotSearch>) =>
  findCommonSlots({ ...base, ...search }).map((slot) => new Date(slot.start).toISOString())

describe('findCommonSlots', () => {
  it('suggests slots inside the daily window', () => {
    expect(starts({})).toEqual(['2026-12-07T09:00:00.000Z', '2026-12-07T09:30:00.000Z', '2026-12-07T10:00:00.000Z'])
  })

  it('skips busy time of anyone', () => {
    const busy = [{ start: at('2026-12-07T09:30:00Z'), end: at('2026-12-07T10:30:00Z') }]
    expect(starts({ busy, perDay: 5 })).toEqual(['2026-12-07T10:30:00.000Z', '2026-12-07T11:00:00.000Z'])
  })

  it('lets a slot end exactly when a busy block starts', () => {
    const busy = [{ start: at('2026-12-07T10:00:00Z'), end: at('2026-12-07T12:00:00Z') }]
    expect(starts({ busy })).toEqual(['2026-12-07T09:00:00.000Z'])
  })

  it('skips weekends unless asked for them', () => {
    expect(starts({ fromDate: '2026-12-05', toDate: '2026-12-06' })).toEqual([])
    expect(starts({ fromDate: '2026-12-05', toDate: '2026-12-06', includeWeekends: true, perDay: 1 })).toEqual([
      '2026-12-05T09:00:00.000Z',
      '2026-12-06T09:00:00.000Z',
    ])
  })

  it('skips blocked days and the past', () => {
    expect(starts({ blockedDates: new Set(['2026-12-07']) })).toEqual([])
    expect(starts({ now: at('2026-12-07T09:45:00Z') })).toEqual([
      '2026-12-07T10:00:00.000Z',
      '2026-12-07T10:30:00.000Z',
      '2026-12-07T11:00:00.000Z',
    ])
  })

  it('works in the viewer time zone', () => {
    expect(starts({ timeZone: 'Europe/Berlin', perDay: 1 })).toEqual(['2026-12-07T08:00:00.000Z'])
  })

  it('limits the number of suggestions', () => {
    expect(starts({ fromDate: '2026-12-07', toDate: '2026-12-11', limit: 4 })).toHaveLength(4)
  })

  it('finds nothing when the duration does not fit the window', () => {
    expect(starts({ durationMinutes: 240 })).toEqual([])
  })
})

describe('parseFreeBusy', () => {
  it('keeps only data of available people', () => {
    const people = parseFreeBusy({
      people: [
        {
          email: 'Ana@Example.com',
          name: 'Ana',
          available: true,
          busy: [
            { start: '2026-12-07T09:00:00Z', end: '2026-12-07T10:00:00Z' },
            { start: 'x', end: 'y' },
          ],
          blockedDates: ['2026-12-08', 'nope'],
        },
        {
          email: 'ben@example.com',
          name: 'Ben',
          available: false,
          busy: [{ start: '2026-12-07T09:00:00Z', end: '2026-12-07T10:00:00Z' }],
        },
        { name: 'missing email' },
      ],
    })
    expect(people).toEqual([
      {
        email: 'ana@example.com',
        name: 'Ana',
        available: true,
        busy: [{ start: at('2026-12-07T09:00:00Z'), end: at('2026-12-07T10:00:00Z') }],
        blockedDates: ['2026-12-08'],
      },
      { email: 'ben@example.com', name: null, available: false, busy: [], blockedDates: [] },
    ])
    expect(combineFreeBusy(people)).toEqual({ busy: people[0].busy, blockedDates: new Set(['2026-12-08']) })
  })
})
