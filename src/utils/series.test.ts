import { describe, expect, it } from 'vitest'
import { calendarEvent, eventInput, recurrence } from '../test/fixtures.ts'
import {
  changeWholeSeries,
  continueSeries,
  excludeOccurrence,
  hasEarlierOccurrences,
  truncateSeries,
} from './series.ts'

const daily = () =>
  calendarEvent({ id: 's', startDate: '2026-11-02', endDate: '2026-11-02', recurrence: recurrence(), excludedDates: ['2026-11-03'] })

describe('series', () => {
  it('knows whether earlier occurrences exist', () => {
    expect(hasEarlierOccurrences(daily(), '2026-11-02')).toBe(false)
    expect(hasEarlierOccurrences(daily(), '2026-11-05')).toBe(true)
  })

  it('excludes a single occurrence', () => {
    expect(excludeOccurrence(daily(), '2026-11-05').excludedDates).toEqual(['2026-11-03', '2026-11-05'])
  })

  it('truncates a series before an occurrence', () => {
    const truncated = truncateSeries({ ...daily(), recurrence: recurrence({ count: 10 }) }, '2026-11-05')
    expect(truncated.recurrence).toMatchObject({ until: '2026-11-04', count: null })
    expect(truncated.excludedDates).toEqual(['2026-11-03'])
  })

  it('continues a series with the remaining count', () => {
    const series = { ...daily(), excludedDates: [], recurrence: recurrence({ count: 10 }) }
    const input = eventInput({ startDate: '2026-11-05', endDate: '2026-11-05', recurrence: recurrence({ count: 10 }) })
    expect(continueSeries(series, '2026-11-05', input).recurrence?.count).toBe(7)
  })

  it('moves the whole series by the shift of the edited occurrence', () => {
    const series = {
      ...daily(),
      recurrence: recurrence({ frequency: 'weekly', weekdays: [0] }),
      excludedDates: ['2026-11-09'],
    }
    const input = eventInput({
      startDate: '2026-11-17',
      endDate: '2026-11-17',
      recurrence: recurrence({ frequency: 'weekly', weekdays: [0] }),
    })
    expect(changeWholeSeries(series, '2026-11-16', input)).toMatchObject({
      startDate: '2026-11-03',
      excludedDates: ['2026-11-10'],
      recurrence: { weekdays: [1] },
    })
  })

  it('turns a series into a single event when the recurrence is removed', () => {
    expect(changeWholeSeries(daily(), '2026-11-05', eventInput({ startDate: '2026-11-05', endDate: '2026-11-05' }))).toMatchObject({
      recurrence: null,
      excludedDates: [],
    })
  })
})
