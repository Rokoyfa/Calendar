import { describe, expect, it } from 'vitest'
import {
  buildBookingLink,
  findBookingHoursProblem,
  groupBookingSlots,
  isBookingCancelable,
  parseBookingPage,
  parseBookingSlots,
  parseBookingSummary,
  toBookingEndTime,
  toBookingSlots,
  toTimeInput,
} from './booking.ts'

const page = {
  id: 'p1',
  calendarId: 'c1',
  token: 'tok',
  title: 'Beratung',
  description: '',
  location: '',
  durationMinutes: 30,
  bufferMinutes: 0,
  minNoticeMinutes: 120,
  horizonDays: 60,
  maxPerDay: null,
  stepMinutes: 30,
  timeZone: 'Europe/Berlin',
  hours: [
    { weekday: 0, start: '09:00', end: '24:00' },
    { weekday: 9, start: '09:00', end: '10:00' },
  ],
  active: true,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

describe('booking', () => {
  it('parses pages and drops invalid hours', () => {
    expect(parseBookingPage(page)?.hours).toEqual([{ weekday: 0, start: '09:00', end: '24:00' }])
    expect(parseBookingPage({ ...page, timeZone: 'Nowhere/City' })).toBeNull()
    expect(parseBookingPage({ ...page, durationMinutes: '30' })).toBeNull()
  })

  it('finds problems with weekly hours', () => {
    expect(findBookingHoursProblem([{ weekday: 0, start: '09:00', end: '12:00' }])).toBeNull()
    expect(findBookingHoursProblem([{ weekday: 0, start: '12:00', end: '09:00' }])).toBe('order')
    expect(
      findBookingHoursProblem([
        { weekday: 1, start: '13:00', end: '17:00' },
        { weekday: 1, start: '09:00', end: '13:30' },
      ]),
    ).toBe('overlap')
    expect(
      findBookingHoursProblem([
        { weekday: 1, start: '09:00', end: '13:00' },
        { weekday: 1, start: '13:00', end: '24:00' },
      ]),
    ).toBeNull()
    expect(
      findBookingHoursProblem(Array.from({ length: 22 }, (_, weekday) => ({ weekday, start: '09:00', end: '10:00' }))),
    ).toBe('tooMany')
  })

  it('maps midnight between the form and the api', () => {
    expect(toBookingEndTime('00:00')).toBe('24:00')
    expect(toBookingEndTime('17:00')).toBe('17:00')
    expect(toTimeInput('24:00')).toBe('00:00')
  })

  it('groups slots by the day in the viewer zone', () => {
    const slots = parseBookingSlots({ slots: ['2026-11-23T22:30:00Z', '2026-11-23T08:00:00Z', 'nonsense'] })
    const days = groupBookingSlots(toBookingSlots(slots, 'Europe/Berlin'))
    expect([...days.keys()]).toEqual(['2026-11-23'])
    expect(days.get('2026-11-23')?.map((slot) => slot.time)).toEqual(['09:00', '23:30'])
    const tokyo = groupBookingSlots(toBookingSlots(slots, 'Asia/Tokyo'))
    expect([...tokyo.keys()]).toEqual(['2026-11-23', '2026-11-24'])
  })

  it('knows when a booking can still be cancelled', () => {
    const summary = parseBookingSummary({
      status: 'confirmed',
      title: 'Beratung',
      start: '2026-11-24T09:00:00Z',
      end: '2026-11-24T09:30:00Z',
      timeZone: 'Europe/Berlin',
    })
    expect(summary).not.toBeNull()
    if (!summary) return
    expect(isBookingCancelable(summary, Date.parse('2026-11-24T08:00:00Z'))).toBe(true)
    expect(isBookingCancelable(summary, Date.parse('2026-11-24T09:00:00Z'))).toBe(false)
    expect(isBookingCancelable({ ...summary, status: 'canceled' }, 0)).toBe(false)
    expect(parseBookingSummary({ ...summary, status: 'unknown' })).toBeNull()
  })

  it('builds links like shared calendars', () => {
    const pageUrl = 'https://example.com/app/?x=1#top'
    expect(buildBookingLink('a b', { routing: 'browser', basename: '/app/', linkParam: 'p' }, pageUrl)).toBe(
      'https://example.com/app/book/a%20b',
    )
    expect(buildBookingLink('abc', { routing: 'memory', linkParam: 'calendarPath' }, pageUrl)).toBe(
      'https://example.com/app/?calendarPath=%2Fbook%2Fabc',
    )
  })
})
