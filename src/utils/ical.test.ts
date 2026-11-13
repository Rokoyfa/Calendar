import { describe, expect, it } from 'vitest'
import { calendarEvent, recurrence } from '../test/fixtures.ts'
import { parseICalendar, toICalendar } from './ical.ts'

const GOOGLE_EXPORT = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'DTSTART;TZID=Europe/Berlin:20261102T090000',
  'DTEND;TZID=Europe/Berlin:20261102T103000',
  'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261130T225959Z',
  'EXDATE;TZID=Europe/Berlin:20261104T090000',
  'UID:abc@google.com',
  'SUMMARY:Team\\, Sync',
  'LOCATION:Raum 1',
  'DESCRIPTION:Zeile 1\\nZeile 2',
  'ATTENDEE;CN=Ben;PARTSTAT=ACCEPTED:mailto:Ben@Example.com',
  'BEGIN:VALARM',
  'TRIGGER:-PT15M',
  'ACTION:DISPLAY',
  'END:VALARM',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261224',
  'DTEND;VALUE=DATE:20261227',
  'UID:holiday',
  'SUMMARY:Feiertage',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20261105T080000Z',
  'DURATION:PT45M',
  'SUMMARY:UTC',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:Broken',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

describe('iCalendar', () => {
  it('reads events from other calendar apps', () => {
    const parsed = parseICalendar(GOOGLE_EXPORT)
    expect(parsed?.skipped).toBe(1)
    const [series, holiday, utc] = parsed!.events.map(({ input }) => input)
    expect(series).toMatchObject({
      uid: 'abc@google.com',
      title: 'Team, Sync',
      location: 'Raum 1',
      description: 'Zeile 1\nZeile 2',
      startDate: '2026-11-02',
      start: '09:00',
      end: '10:30',
      timeZone: 'Europe/Berlin',
      recurrence: { frequency: 'weekly', weekdays: [0, 2], until: '2026-11-30', count: null },
      excludedDates: ['2026-11-04'],
      reminders: [15],
      attendees: [{ email: 'ben@example.com', name: 'Ben', status: 'accepted' }],
    })
    expect(holiday).toMatchObject({ allDay: true, startDate: '2026-12-24', endDate: '2026-12-26', timeZone: null })
    expect(utc).toMatchObject({ start: '08:00', end: '08:45', timeZone: 'UTC' })
  })

  it('keeps events intact when exporting and importing again', () => {
    const series = calendarEvent({
      uid: 'series-uid',
      title: 'Yoga; Kurs',
      location: 'Halle, Nord',
      links: [
        { url: 'https://example.com/yoga?kurs=1,2', label: 'Kurs; Infos' },
        { url: 'https://maps.example.com/halle', label: '' },
      ],
      timeZone: 'Europe/Berlin',
      recurrence: recurrence({ frequency: 'monthly', monthlyMode: 'weekdayOfMonth', count: 5 }),
      excludedDates: ['2026-12-07'],
      reminders: [30, 1440],
    })
    const detached = calendarEvent({
      uid: 'series-uid',
      startDate: '2026-12-07',
      endDate: '2026-12-07',
      start: '11:00',
      end: '12:00',
      timeZone: 'Europe/Berlin',
      seriesId: series.id,
      originalDate: '2026-12-07',
    })
    const text = toICalendar([series, detached], 'Test', { now: new Date('2026-11-11T12:00:00Z') })
    expect(text.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true)
    const [again, exception] = parseICalendar(text)!.events
    expect(again.input).toMatchObject({
      uid: 'series-uid',
      title: 'Yoga; Kurs',
      location: 'Halle, Nord',
      links: [
        { url: 'https://example.com/yoga?kurs=1,2', label: 'Kurs; Infos' },
        { url: 'https://maps.example.com/halle', label: '' },
      ],
      recurrence: { frequency: 'monthly', monthlyMode: 'weekdayOfMonth', count: 5 },
      excludedDates: ['2026-12-07'],
      reminders: [30, 1440],
    })
    expect(exception).toMatchObject({ recurrenceId: '2026-12-07', input: { uid: 'series-uid', start: '11:00' } })
  })

  it('writes categories by name and reads them back', () => {
    const event = calendarEvent({ categoryIds: ['a', 'b', 'gone'] })
    const categoryNames = new Map([
      ['a', 'Training, Halle'],
      ['b', 'Spiel; Heim'],
    ])
    const text = toICalendar([event], 'Test', { categoryNames })
    expect(text).toContain('CATEGORIES:Training\\, Halle,Spiel\\; Heim')
    expect(parseICalendar(text)!.events[0]).toMatchObject({
      categoryNames: ['Training, Halle', 'Spiel; Heim'],
      input: { categoryIds: [] },
    })
  })

  it('merges category lines, trims names and drops duplicates', () => {
    const text = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:x',
      'DTSTART;VALUE=DATE:20261201',
      'SUMMARY:Feier',
      'CATEGORIES:Feier,  Verein ,',
      'CATEGORIES:verein,Feier,Extra',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    expect(parseICalendar(text)!.events[0].categoryNames).toEqual(['Feier', 'Verein', 'Extra'])
  })

  it('exports no categories line without names', () => {
    expect(toICalendar([calendarEvent({ categoryIds: ['a'] })], 'Test')).not.toContain('CATEGORIES')
  })
})
