import { describe, expect, it } from 'vitest'
import {
  addDaysToISODate,
  addMonthsToISODate,
  daysBetween,
  endOfMonthISO,
  fromISODate,
  getMonthWeeks,
  getWeekNumber,
  isISODate,
  isTime,
  listISODates,
  minutesToTime,
  startOfWeekISO,
  timeToMinutes,
} from './date.ts'

const ISO = { firstDay: 1, minimalDays: 4 }
const US = { firstDay: 0, minimalDays: 1 }

describe('date', () => {
  it('runs in a zone with daylight saving time', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Berlin')
  })

  it('validates dates and times', () => {
    expect(isISODate('2026-02-28')).toBe(true)
    expect(isISODate('2026-13-01')).toBe(false)
    expect(isTime('23:59')).toBe(true)
    expect(isTime('24:00')).toBe(false)
  })

  it('converts between times and minutes', () => {
    expect(timeToMinutes('13:45')).toBe(825)
    expect(minutesToTime(825)).toBe('13:45')
  })

  it('counts days across daylight saving changes', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(addDaysToISODate('2026-10-24', 2)).toBe('2026-10-26')
    expect(listISODates('2026-10-24', '2026-10-26')).toEqual(['2026-10-24', '2026-10-25', '2026-10-26'])
  })

  it('clamps adding months to the end of the month', () => {
    expect(addMonthsToISODate('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonthsToISODate('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonthsToISODate('2026-12-15', 1)).toBe('2027-01-15')
    expect(endOfMonthISO('2026-02-10')).toBe('2026-02-28')
  })

  it('starts weeks on the given day', () => {
    expect(startOfWeekISO('2026-11-05')).toBe('2026-11-02')
    expect(startOfWeekISO('2026-11-05', 0)).toBe('2026-11-01')
    expect(startOfWeekISO('2026-11-01', 1)).toBe('2026-10-26')
  })

  it('builds full weeks for a month grid', () => {
    const weeks = getMonthWeeks('2026-11-15')
    expect(weeks[0][0]).toBe('2026-10-26')
    expect(weeks.at(-1)?.at(-1)).toBe('2026-12-06')
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(getMonthWeeks('2026-11-15', 0)[0][0]).toBe('2026-11-01')
  })

  it('numbers ISO weeks', () => {
    expect(getWeekNumber(fromISODate('2026-01-01'), ISO)).toBe(1)
    expect(getWeekNumber(fromISODate('2026-11-05'), ISO)).toBe(45)
    expect(getWeekNumber(fromISODate('2027-01-01'), ISO)).toBe(53)
    expect(getWeekNumber(fromISODate('2021-01-03'), ISO)).toBe(53)
  })

  it('numbers US weeks', () => {
    expect(getWeekNumber(fromISODate('2026-01-01'), US)).toBe(1)
    expect(getWeekNumber(fromISODate('2026-11-08'), US)).toBe(46)
    expect(getWeekNumber(fromISODate('2026-12-31'), US)).toBe(1)
  })
})
