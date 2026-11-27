import { describe, expect, it } from 'vitest'
import { caldavEventId, isServerUrl, parseCaldavAccounts, parseCaldavEventId, type CaldavCalendar } from './caldav.ts'
import { buildCaldavObject, toCaldavEvents } from './caldavObject.ts'

const calendar: CaldavCalendar = {
  id: 'cal1',
  name: 'Work',
  color: 'green',
  shown: true,
  readOnly: false,
  position: 0,
  syncedAt: null,
}

const SERIES = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Other//EN',
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Berlin',
  'BEGIN:STANDARD',
  'DTSTART:19701025T030000',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'END:STANDARD',
  'END:VTIMEZONE',
  'BEGIN:VEVENT',
  'UID:series@example.com',
  'DTSTAMP:20261101T000000Z',
  'SEQUENCE:3',
  'DTSTART;TZID=Europe/Berlin:20261123T003000',
  'DTEND;TZID=Europe/Berlin:20261123T013000',
  'SUMMARY:Night shift',
  'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=6',
  'EXDATE;TZID=Europe/Berlin:20261130T003000',
  'ORGANIZER;CN=Boss:mailto:boss@example.com',
  'ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;CN=Ann;PARTSTAT=NEEDS-ACTION:mailto:ann@example.com',
  'CATEGORIES:Ops',
  'X-CUSTOM:keep me',
  'ATTACH;ENCODING=BASE64;VALUE=BINARY:aGVsbG8=',
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  'TRIGGER:-PT15M',
  'END:VALARM',
  'BEGIN:VALARM',
  'ACTION:EMAIL',
  'TRIGGER;VALUE=DATE-TIME:20261122T080000Z',
  'END:VALARM',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:series@example.com',
  'DTSTAMP:20261101T000000Z',
  'RECURRENCE-ID:20261206T233000Z',
  'DTSTART;TZID=Europe/Berlin:20261207T020000',
  'DTEND;TZID=Europe/Berlin:20261207T030000',
  'SUMMARY:Night shift (late)',
  'END:VEVENT',
  'END:VCALENDAR',
  '',
].join('\r\n')

describe('caldav', () => {
  it('builds event ids that can be read back', () => {
    const id = caldavEventId('cal1', 'abc', '2026-12-07')
    expect(id).toBe('caldav:cal1:abc:2026-12-07')
    expect(parseCaldavEventId(id)).toEqual({ calendarId: 'cal1', objectId: 'abc', originalDate: '2026-12-07' })
    expect(parseCaldavEventId(caldavEventId('cal1', 'abc'))).toEqual({
      calendarId: 'cal1',
      objectId: 'abc',
      originalDate: null,
    })
    expect(parseCaldavEventId('other:1')).toBeNull()
  })

  it('accepts only https server addresses without a login', () => {
    expect(isServerUrl('https://cloud.example.com/remote.php/dav')).toBe(true)
    expect(isServerUrl('http://cloud.example.com/')).toBe(false)
    expect(isServerUrl('https://user:pw@cloud.example.com/')).toBe(false)
  })

  it('reads accounts and ignores broken entries', () => {
    expect(
      parseCaldavAccounts([
        {
          id: 'a',
          name: 'Cloud',
          serverHost: 'cloud.example.com',
          username: 'me',
          calendars: [{ id: 'c', name: 'X' }],
        },
        { name: 'missing id' },
      ]),
    ).toMatchObject([{ id: 'a', calendars: [{ id: 'c', color: 'blue', shown: true, readOnly: false }] }])
  })

  it('turns an object into a series with its detached occurrence', () => {
    const [series, detached] = toCaldavEvents(calendar, { id: 'obj', etag: '"1"', data: SERIES })
    expect(series).toMatchObject({
      id: 'caldav:cal1:obj',
      calendarId: 'caldav:cal1',
      title: 'Night shift',
      color: 'green',
      timeZone: 'Europe/Berlin',
      excludedDates: ['2026-11-30', '2026-12-07'],
      reminders: [15],
    })
    expect(detached).toMatchObject({
      id: 'caldav:cal1:obj:2026-12-07',
      seriesId: 'caldav:cal1:obj',
      originalDate: '2026-12-07',
      start: '02:00',
      uid: 'series@example.com',
    })
  })

  it('changes only the managed parts of an existing object', () => {
    const [series, detached] = toCaldavEvents(calendar, { id: 'obj', etag: '"1"', data: SERIES })
    const attendees = series.attendees.map((attendee) => ({ ...attendee, status: 'accepted' as const }))
    const text = buildCaldavObject(
      SERIES,
      [{ ...series, title: 'Night shift renamed', reminders: [30], attendees }, detached],
      'green',
      new Date('2026-11-20T10:00:00Z'),
    )
    const unfolded = text.replace(/\r\n /g, '')
    expect(unfolded).toContain('SUMMARY:Night shift renamed')
    expect(unfolded).toContain('ORGANIZER;CN=Boss:mailto:boss@example.com')
    expect(unfolded).toContain(
      'ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;CN="Ann";PARTSTAT=ACCEPTED:mailto:ann@example.com',
    )
    expect(unfolded).toContain('CATEGORIES:Ops')
    expect(unfolded).toContain('X-CUSTOM:keep me')
    expect(unfolded).toContain('ATTACH;ENCODING=BASE64;VALUE=BINARY:aGVsbG8=')
    expect(unfolded).toContain('TRIGGER;VALUE=DATE-TIME:20261122T080000Z')
    expect(unfolded).toContain('TRIGGER:-PT30M')
    expect(unfolded).not.toContain('TRIGGER:-PT15M')
    expect(unfolded).toContain('SEQUENCE:4')
    expect(unfolded).toContain('RECURRENCE-ID:20261206T233000Z')
    expect(unfolded).toContain('EXDATE;TZID=Europe/Berlin:20261130T003000')
    expect(unfolded).not.toContain('EXDATE;TZID=Europe/Berlin:20261207T003000')
    expect(unfolded.match(/BEGIN:VTIMEZONE/g)).toHaveLength(1)
    expect(unfolded).not.toContain('COLOR:')
    const again = toCaldavEvents(calendar, { id: 'obj', etag: '"2"', data: text })
    expect(again).toHaveLength(2)
    expect(again[0]).toMatchObject({
      title: 'Night shift renamed',
      reminders: [30],
      excludedDates: ['2026-11-30', '2026-12-07'],
    })
  })

  it('excludes the date again when a detached occurrence is removed', () => {
    const [series] = toCaldavEvents(calendar, { id: 'obj', etag: '"1"', data: SERIES })
    const text = buildCaldavObject(SERIES, [series], 'green').replace(/\r\n /g, '')
    expect(text).not.toContain('RECURRENCE-ID')
    expect(text).toContain('EXDATE;TZID=Europe/Berlin:20261207T003000')
  })

  it('writes a new object with time zone and own color', () => {
    const [series] = toCaldavEvents(calendar, { id: 'obj', etag: '"1"', data: SERIES })
    const text = buildCaldavObject(
      null,
      [{ ...series, uid: 'new@example.com', timeZone: 'America/New_York', color: 'red', excludedDates: [] }],
      'green',
    ).replace(/\r\n /g, '')
    expect(text).toContain('PRODID:-//Rokoyfa//Calendar//EN')
    expect(text).toContain('TZID:America/New_York')
    expect(text).toContain('DTSTART;TZID=America/New_York:20261123T003000')
    expect(text).toContain('COLOR:red')
    expect(text.indexOf('COLOR:red')).toBeLessThan(text.indexOf('BEGIN:VALARM'))
  })

  it('keeps rules it cannot edit when other details change', () => {
    const data = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:payday@example.com',
      'DTSTART;VALUE=DATE:20260130',
      'DTEND;VALUE=DATE:20260131',
      'SUMMARY:Payday',
      'RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=12',
      'RDATE;VALUE=DATE:20261224',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n')
    const [series] = toCaldavEvents(calendar, { id: 'pay', etag: '"1"', data })
    expect(series.recurrence).toMatchObject({ rule: 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1', count: 12 })
    const text = buildCaldavObject(data, [{ ...series, title: 'Salary' }], 'green').replace(/\r\n /g, '')
    expect(text).toContain('RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=12')
    expect(text).toContain('RDATE;VALUE=DATE:20261224')
    expect(text).toContain('SUMMARY:Salary')
  })
})
