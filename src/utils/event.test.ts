import { describe, expect, it } from 'vitest'
import { en } from '../i18n/messages/en/index.ts'
import { calendarEvent, eventInput, recurrence } from '../test/fixtures.ts'
import {
  createAllDayEventInput,
  createEventInputForSlots,
  eventOccursInRange,
  expandEvents,
  getEventDuration,
  hasValidationErrors,
  normalizeEventInput,
  parseCalendarEvent,
  toOccurrenceInput,
  validateEventInput,
} from './event.ts'

const m = en

describe('event', () => {
  it('measures durations across days', () => {
    expect(getEventDuration(eventInput({ start: '22:00', endDate: '2026-11-03', end: '02:00' }))).toBe(240)
  })

  it('creates inputs from selected hour slots', () => {
    expect(createEventInputForSlots({ date: '2026-11-06', hour: 12 }, { date: '2026-11-08', hour: 18 }, null)).toMatchObject({
      startDate: '2026-11-06',
      start: '12:00',
      endDate: '2026-11-08',
      end: '19:00',
    })
    expect(createEventInputForSlots({ date: '2026-11-06', hour: 23 }, { date: '2026-11-06', hour: 23 }, null)).toMatchObject({
      endDate: '2026-11-07',
      end: '00:00',
    })
  })

  it('validates inputs', () => {
    expect(hasValidationErrors(validateEventInput(eventInput(), m))).toBe(false)
    expect(validateEventInput(eventInput({ title: '' }), m).title).toBe(m.validation.titleRequired)
    expect(validateEventInput(eventInput({ end: '08:00' }), m).end).toBe(m.validation.endBeforeStart)
    expect(validateEventInput(eventInput({ endDate: '2026-11-01' }), m).endDate).toBe(m.validation.endDateBeforeStart)
    const weekly = eventInput({ recurrence: recurrence({ frequency: 'weekly', weekdays: [] }) })
    expect(validateEventInput(weekly, m).recurrence?.weekdays).toBe(m.validation.weekdaysRequired)
  })

  it('normalizes inputs', () => {
    const series = eventInput({ title: '  Hi ', recurrence: recurrence(), seriesId: 'x', originalDate: '2026-11-01' })
    expect(normalizeEventInput(series)).toMatchObject({ title: 'Hi', seriesId: null, originalDate: null })
    expect(normalizeEventInput(eventInput({ excludedDates: ['2026-11-03'] })).excludedDates).toEqual([])
  })

  it('parses stored events including the legacy date field', () => {
    const legacy: Record<string, unknown> = { ...calendarEvent({ id: 'a' }) }
    delete legacy.startDate
    delete legacy.endDate
    expect(parseCalendarEvent({ ...legacy, date: '2026-11-04' })).toMatchObject({
      startDate: '2026-11-04',
      endDate: '2026-11-04',
    })
    expect(parseCalendarEvent({ ...legacy, date: 'broken' })).toBeNull()
    expect(parseCalendarEvent(null)).toBeNull()
  })

  it('expands series into occurrences, also multi-day ones starting before the range', () => {
    const series = calendarEvent({
      id: 's',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      recurrence: recurrence({ frequency: 'weekly', weekdays: [6] }),
      excludedDates: ['2026-11-08'],
    })
    const occurrences = expandEvents([series], '2026-11-09', '2026-11-16')
    expect(occurrences.map(({ startDate, endDate }) => `${startDate}/${endDate}`)).toEqual(['2026-11-15/2026-11-16'])
    expect(occurrences[0]).toMatchObject({ occurrenceKey: 's:2026-11-15', seriesStartDate: '2026-11-01' })
    expect(eventOccursInRange(series, '2026-11-02', '2026-11-02')).toBe(true)
  })

  it('reads old events as floating timed events', () => {
    const stored: Record<string, unknown> = { ...calendarEvent() }
    delete stored.allDay
    delete stored.timeZone
    expect(parseCalendarEvent(stored)).toMatchObject({ allDay: false, timeZone: null })
    expect(parseCalendarEvent({ ...calendarEvent(), timeZone: 'Mars/Base' })?.timeZone).toBeNull()
  })

  it('stores all-day events without times or zone', () => {
    expect(createAllDayEventInput('2026-11-02', '2026-11-04')).toMatchObject({ allDay: true, start: '00:00', end: '00:00', timeZone: null })
    expect(normalizeEventInput(eventInput({ allDay: true, start: '09:00', timeZone: 'Asia/Tokyo' }))).toMatchObject({ start: '00:00', end: '00:00', timeZone: null })
    expect(getEventDuration(createAllDayEventInput('2026-11-02', '2026-11-04'))).toBe(3 * 1440)
  })

  it('converts zoned events to the viewer zone', () => {
    const event = calendarEvent({ startDate: '2026-11-02', start: '09:00', endDate: '2026-11-02', end: '10:00', timeZone: 'America/New_York' })
    const [occurrence] = expandEvents([event], '2026-11-02', '2026-11-02', 'Europe/Berlin')
    expect(occurrence).toMatchObject({ startDate: '2026-11-02', start: '15:00', end: '16:00', occurrenceDate: '2026-11-02' })
    expect(toOccurrenceInput(occurrence)).toMatchObject({ start: '09:00', end: '10:00', timeZone: 'America/New_York' })
  })

  it('moves zoned occurrences across the date line', () => {
    const event = calendarEvent({ startDate: '2026-11-02', start: '20:00', endDate: '2026-11-02', end: '21:00', timeZone: 'America/Los_Angeles', recurrence: recurrence() })
    const occurrences = expandEvents([event], '2026-11-03', '2026-11-03', 'Asia/Tokyo')
    expect(occurrences.map((o) => [o.startDate, o.start, o.occurrenceDate])).toEqual([['2026-11-03', '13:00', '2026-11-02']])
  })

  it('keeps floating and all-day events at their wall time', () => {
    const floating = calendarEvent({ start: '09:00', end: '10:00' })
    const allDay = calendarEvent(createAllDayEventInput('2026-11-02'))
    const occurrences = expandEvents([floating, allDay], '2026-11-02', '2026-11-02', 'Asia/Tokyo')
    expect(occurrences.map((o) => [o.startDate, o.start])).toEqual([['2026-11-02', '09:00'], ['2026-11-02', '00:00']])
  })
})
