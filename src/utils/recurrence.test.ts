import { describe, expect, it } from 'vitest'
import { recurrence } from '../test/fixtures.ts'
import {
  adaptRecurrenceToStart,
  countOccurrencesBefore,
  getOccurrenceDates,
  isSameRecurrence,
  parseRecurrence,
  shiftWeekdays,
} from './recurrence.ts'

describe('getOccurrenceDates', () => {
  it('repeats daily with an interval', () => {
    expect(getOccurrenceDates('2026-11-01', recurrence({ interval: 3 }), '2026-11-01', '2026-11-10')).toEqual([
      '2026-11-01',
      '2026-11-04',
      '2026-11-07',
      '2026-11-10',
    ])
  })

  it('starts inside the window without generating earlier dates', () => {
    expect(getOccurrenceDates('2026-01-01', recurrence(), '2026-11-05', '2026-11-06')).toEqual(['2026-11-05', '2026-11-06'])
  })

  it('repeats weekly on several weekdays every second week', () => {
    const rule = recurrence({ frequency: 'weekly', interval: 2, weekdays: [0, 2] })
    expect(getOccurrenceDates('2026-11-02', rule, '2026-11-01', '2026-11-30')).toEqual([
      '2026-11-02',
      '2026-11-04',
      '2026-11-16',
      '2026-11-18',
      '2026-11-30',
    ])
  })

  it('skips months without the day', () => {
    const rule = recurrence({ frequency: 'monthly' })
    expect(getOccurrenceDates('2026-01-31', rule, '2026-01-01', '2026-06-30')).toEqual([
      '2026-01-31',
      '2026-03-31',
      '2026-05-31',
    ])
  })

  it('repeats on the nth and last weekday of the month', () => {
    const second = recurrence({ frequency: 'monthly', monthlyMode: 'weekdayOfMonth' })
    expect(getOccurrenceDates('2026-11-10', second, '2026-11-01', '2027-01-31')).toEqual([
      '2026-11-10',
      '2026-12-08',
      '2027-01-12',
    ])
    const last = recurrence({ frequency: 'monthly', monthlyMode: 'lastWeekdayOfMonth' })
    expect(getOccurrenceDates('2026-11-27', last, '2026-11-01', '2027-01-31')).toEqual([
      '2026-11-27',
      '2026-12-25',
      '2027-01-29',
    ])
  })

  it('repeats yearly only in leap years for February 29', () => {
    const rule = recurrence({ frequency: 'yearly' })
    expect(getOccurrenceDates('2024-02-29', rule, '2024-01-01', '2032-12-31')).toEqual([
      '2024-02-29',
      '2028-02-29',
      '2032-02-29',
    ])
  })

  it('stops at until and after count', () => {
    expect(getOccurrenceDates('2026-11-01', recurrence({ until: '2026-11-03' }), '2026-11-01', '2026-11-30')).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ])
    expect(getOccurrenceDates('2026-11-01', recurrence({ count: 3 }), '2026-11-02', '2026-11-30')).toEqual([
      '2026-11-02',
      '2026-11-03',
    ])
  })

  it('counts occurrences before a date', () => {
    expect(countOccurrencesBefore('2026-11-01', recurrence({ frequency: 'weekly', weekdays: [6] }), '2026-11-20')).toBe(3)
  })
})

describe('recurrence helpers', () => {
  it('parses stored rules and rejects broken ones', () => {
    expect(parseRecurrence({ frequency: 'weekly', interval: 1, weekdays: [3, 1, 1] })).toEqual(
      recurrence({ frequency: 'weekly', weekdays: [1, 3] }),
    )
    expect(parseRecurrence({ frequency: 'hourly', interval: 1, weekdays: [] })).toBeNull()
    expect(parseRecurrence({ frequency: 'daily', interval: 0, weekdays: [] })).toBeNull()
  })

  it('compares rules by what matters for the frequency', () => {
    expect(isSameRecurrence(recurrence({ weekdays: [1] }), recurrence({ weekdays: [2] }))).toBe(true)
    expect(
      isSameRecurrence(recurrence({ frequency: 'weekly', weekdays: [1] }), recurrence({ frequency: 'weekly', weekdays: [2] })),
    ).toBe(false)
    expect(isSameRecurrence(null, null)).toBe(true)
  })

  it('shifts weekdays and follows a moved start', () => {
    expect(shiftWeekdays([5, 6], 1)).toEqual([0, 6])
    const weekly = recurrence({ frequency: 'weekly', weekdays: [0] })
    expect(adaptRecurrenceToStart(weekly, '2026-11-02', '2026-11-04')?.weekdays).toEqual([2])
    const last = recurrence({ frequency: 'monthly', monthlyMode: 'lastWeekdayOfMonth' })
    expect(adaptRecurrenceToStart(last, '2026-11-27', '2026-11-06')?.monthlyMode).toBe('weekdayOfMonth')
  })
})
