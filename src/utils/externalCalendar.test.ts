import { describe, expect, it } from 'vitest'
import { expandEvents } from './event.ts'
import {
  externalCalendarId,
  isCalendarUrl,
  isExternalEvent,
  normalizeCalendarUrl,
  parseExternalCalendars,
  toExternalEvents,
  type ExternalCalendar,
} from './externalCalendar.ts'

const CALENDAR: ExternalCalendar = {
  id: 'ext-1',
  name: 'Feiertage',
  color: 'green',
  shown: true,
  position: 0,
  urlHost: 'example.com',
  fetchedAt: null,
  error: null,
}

const SERIES_WITH_EXCEPTION = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'UID:weekly@example.com',
  'DTSTART:20261102T090000',
  'DTEND:20261102T100000',
  'RRULE:FREQ=WEEKLY;COUNT=3',
  'SUMMARY:Weekly',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:weekly@example.com',
  'RECURRENCE-ID:20261109T090000',
  'DTSTART:20261109T140000',
  'DTEND:20261109T150000',
  'SUMMARY:Weekly moved',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:orphan@example.com',
  'RECURRENCE-ID:20261110T090000',
  'DTSTART:20261110T090000',
  'DTEND:20261110T100000',
  'SUMMARY:Orphan',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

describe('external calendars', () => {
  it('accepts only https and webcal addresses without a login', () => {
    expect(isCalendarUrl('https://example.com/a.ics')).toBe(true)
    expect(isCalendarUrl('webcal://example.com/a.ics')).toBe(true)
    expect(normalizeCalendarUrl(' webcal://example.com/a.ics ')).toBe('https://example.com/a.ics')
    expect(isCalendarUrl('http://example.com/a.ics')).toBe(false)
    expect(isCalendarUrl('https://user:secret@example.com/a.ics')).toBe(false)
    expect(isCalendarUrl('javascript:alert(1)')).toBe(false)
    expect(isCalendarUrl(`https://example.com/${'a'.repeat(2000)}`)).toBe(false)
  })

  it('parses and sorts the list', () => {
    const calendars = parseExternalCalendars([
      { id: 'b', name: 'B', color: 'nope', position: 2 },
      { id: 'a', name: 'A', color: 'red', position: 1, shown: false, urlHost: 'x.org', error: 'invalidCalendarUrl' },
      { name: 'missing id' },
    ])
    expect(calendars.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(calendars[0]).toMatchObject({ color: 'red', shown: false, urlHost: 'x.org', error: 'invalidCalendarUrl' })
    expect(calendars[1].color).toBe('blue')
  })

  it('turns an iCalendar file into read-only events of the external calendar', () => {
    const events = toExternalEvents(CALENDAR, SERIES_WITH_EXCEPTION)
    expect(events).toHaveLength(3)
    expect(events.every((event) => event.calendarId === externalCalendarId('ext-1') && isExternalEvent(event))).toBe(
      true,
    )
    expect(events.every((event) => event.color === 'green' && event.reminders.length === 0)).toBe(true)
    const [series, moved, orphan] = events
    expect(series.excludedDates).toEqual(['2026-11-09'])
    expect(moved).toMatchObject({ seriesId: series.id, originalDate: '2026-11-09', start: '14:00' })
    expect(orphan).toMatchObject({ seriesId: null, originalDate: null })
    const occurrences = expandEvents(events, '2026-11-01', '2026-11-30')
    expect(occurrences.map(({ startDate, start }) => `${startDate} ${start}`).sort()).toEqual([
      '2026-11-02 09:00',
      '2026-11-09 14:00',
      '2026-11-10 09:00',
      '2026-11-16 09:00',
    ])
  })

  it('ignores text that is not a calendar', () => {
    expect(toExternalEvents(CALENDAR, '<html>Not a calendar</html>')).toEqual([])
  })
})
