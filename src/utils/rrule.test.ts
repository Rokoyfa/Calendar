import { describe, expect, it } from 'vitest'
import { recurrence } from '../test/fixtures.ts'
import { parseICalendar, toICalendar } from './ical.ts'
import { getOccurrenceDates } from './recurrence.ts'
import { isRule, normalizeRule, toSimpleRecurrence } from './rrule.ts'
import { calendarEvent } from '../test/fixtures.ts'

const dates = (
  rule: string,
  start: string,
  from: string,
  to: string,
  extra: Partial<Parameters<typeof recurrence>[0]> = {},
) => getOccurrenceDates(start, recurrence({ rule, ...extra }), from, to)

describe('rrule', () => {
  it('expands several days of the month', () => {
    expect(dates('FREQ=MONTHLY;BYMONTHDAY=1,15', '2026-01-01', '2026-01-01', '2026-03-31')).toEqual([
      '2026-01-01',
      '2026-01-15',
      '2026-02-01',
      '2026-02-15',
      '2026-03-01',
      '2026-03-15',
    ])
  })

  it('finds the last working day of every month', () => {
    expect(dates('FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1', '2026-01-30', '2026-01-01', '2026-05-31')).toEqual([
      '2026-01-30',
      '2026-02-27',
      '2026-03-31',
      '2026-04-30',
      '2026-05-29',
    ])
  })

  it('handles the last day of the month', () => {
    expect(dates('FREQ=MONTHLY;BYMONTHDAY=-1', '2026-01-31', '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ])
  })

  it('handles the fourth Thursday of November', () => {
    expect(dates('FREQ=YEARLY;BYMONTH=11;BYDAY=4TH', '2026-11-26', '2026-01-01', '2028-12-31')).toEqual([
      '2026-11-26',
      '2027-11-25',
      '2028-11-23',
    ])
  })

  it('combines several months and counts the start as first occurrence', () => {
    expect(
      dates('FREQ=YEARLY;BYMONTH=3,9;BYMONTHDAY=10', '2026-02-01', '2026-01-01', '2030-12-31', { count: 4 }),
    ).toEqual(['2026-02-01', '2026-03-10', '2026-09-10', '2027-03-10'])
  })

  it('skips to the window without losing the pattern', () => {
    expect(dates('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR', '2026-01-05', '2026-03-01', '2026-03-15')).toEqual([
      '2026-03-02',
      '2026-03-06',
    ])
  })

  it('adds extra dates and respects the end', () => {
    expect(
      dates('FREQ=MONTHLY;BYMONTHDAY=1,15', '2026-01-01', '2026-01-01', '2026-02-28', {
        until: '2026-01-31',
        dates: ['2026-02-20'],
      }),
    ).toEqual(['2026-01-01', '2026-01-15', '2026-02-20'])
  })

  it('keeps simple rules simple and marks others as custom', () => {
    expect(toSimpleRecurrence('FREQ=WEEKLY;BYDAY=MO,WE', '2026-01-05')).toEqual({
      simple: { frequency: 'weekly', interval: 1, weekdays: [0, 2], monthlyMode: 'dayOfMonth' },
      exact: true,
    })
    expect(toSimpleRecurrence('FREQ=MONTHLY;BYDAY=-1FR', '2026-01-30')?.simple.monthlyMode).toBe('lastWeekdayOfMonth')
    expect(toSimpleRecurrence('FREQ=MONTHLY;BYDAY=-1FR', '2026-01-30')?.exact).toBe(true)
    expect(toSimpleRecurrence('FREQ=YEARLY;BYMONTHDAY=15', '2026-01-15')?.exact).toBe(false)
    expect(toSimpleRecurrence('FREQ=MONTHLY;BYMONTHDAY=1,15', '2026-01-01')?.exact).toBe(false)
    expect(normalizeRule('freq=monthly;count=3;bymonthday=1,15')).toBe('FREQ=MONTHLY;BYMONTHDAY=1,15')
    expect(isRule('FREQ=MONTHLY;BYMONTHDAY=1,15')).toBe(true)
    expect(isRule('FREQ=MONTHLY;COUNT=2')).toBe(false)
    expect(isRule('FREQ=MONTHLY;BYMONTHDAY=40')).toBe(false)
  })

  it('reads and writes custom rules and extra dates without losing them', () => {
    const text = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:x',
      'DTSTART;TZID=America/Los_Angeles:20260130T170000',
      'DTEND;TZID=America/Los_Angeles:20260130T180000',
      'SUMMARY:Payday',
      'RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;UNTIL=20260601T005959Z',
      'RDATE;TZID=America/Los_Angeles:20260612T170000',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const imported = parseICalendar(text)!.events[0].input
    expect(imported.recurrence).toMatchObject({
      rule: 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1',
      until: '2026-05-31',
      dates: ['2026-06-12'],
    })
    const exported = toICalendar([calendarEvent({ ...imported, id: 'x' })], 'Test')
    expect(exported).toContain('RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;UNTIL=20260601T065900Z')
    expect(exported).toContain('RDATE;TZID=America/Los_Angeles:20260612T170000')
    expect(parseICalendar(exported)!.events[0].input.recurrence).toEqual(imported.recurrence)
  })

  it('reads an end before the start time as the day before', () => {
    const text = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:y',
      'DTSTART;TZID=Europe/Berlin:20260105T180000',
      'RRULE:FREQ=DAILY;UNTIL=20260110T120000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    expect(parseICalendar(text)!.events[0].input.recurrence?.until).toBe('2026-01-09')
  })
})
