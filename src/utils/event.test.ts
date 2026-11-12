import { describe, expect, it } from 'vitest'
import { en } from '../i18n/messages/en/index.ts'
import { calendarEvent, eventInput, recurrence } from '../test/fixtures.ts'
import {
  createAllDayEventInput,
  createEventInputForSlots,
  eventOccursInRange,
  expandEvents,
  changesOnlyReminders,
  getEventDuration,
  getLinkName,
  hasValidationErrors,
  matchesEventText,
  normalizeEventInput,
  parseCalendarEvent,
  toOccurrenceInput,
  toViewerOccurrencePeriod,
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

  it('detects changes that only touch the own reminders', () => {
    const input = eventInput()
    expect(changesOnlyReminders(input, { ...input, reminders: [10] })).toBe(true)
    expect(changesOnlyReminders(input, { ...input, title: `${input.title} `, reminders: [10] })).toBe(true)
    expect(changesOnlyReminders(input, { ...input, title: 'Neu', reminders: [10] })).toBe(false)
    expect(changesOnlyReminders(input, input)).toBe(false)
  })

  it('normalizes, validates and sanitizes links', () => {
    const input = eventInput({
      links: [
        { url: ' example.com/plan ', label: ' Plan ' },
        { url: '', label: '' },
      ],
    })
    expect(normalizeEventInput(input).links).toEqual([{ url: 'https://example.com/plan', label: 'Plan' }])
    expect(validateEventInput(eventInput({ links: [{ url: 'javascript:alert(1)', label: '' }] }), m).links).toBe(
      m.validation.linkInvalid,
    )
    expect(validateEventInput(eventInput({ links: [{ url: 'https://nicht gültig', label: '' }] }), m).links).toBe(
      m.validation.linkInvalid,
    )
    expect(validateEventInput(eventInput({ links: [{ url: '', label: 'Nur Text' }] }), m).links).toBe(
      m.validation.linkInvalid,
    )
    const stored = parseCalendarEvent({
      ...calendarEvent(),
      links: [{ url: 'javascript:alert(1)' }, { url: 'https://example.com/', label: 3 }],
    })
    expect(stored?.links).toEqual([{ url: 'https://example.com/', label: '' }])
    expect(getLinkName(stored!.links[0])).toBe('example.com')
    expect(matchesEventText({ ...stored!, title: 'X' }, 'EXAMPLE')).toBe(true)
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

  it('shows a series from another zone correctly while only one side switches daylight saving time', () => {
    const series = calendarEvent({
      startDate: '2026-10-20',
      start: '10:00',
      endDate: '2026-10-20',
      end: '11:00',
      timeZone: 'America/New_York',
      recurrence: recurrence({ frequency: 'weekly', weekdays: [1], count: 3 }),
    })
    const shown = expandEvents([series], '2026-10-19', '2026-11-08', 'Europe/Berlin')
    expect(shown.map(({ startDate, start, end }) => `${startDate} ${start}-${end}`)).toEqual([
      '2026-10-20 16:00-17:00',
      '2026-10-27 15:00-16:00',
      '2026-11-03 16:00-17:00',
    ])
  })

  it('finds events that move more than one day between the creator and the viewer', () => {
    const event = calendarEvent({
      startDate: '2026-11-10',
      start: '23:00',
      endDate: '2026-11-10',
      end: '23:30',
      timeZone: 'Pacific/Pago_Pago',
    })
    expect(expandEvents([event], '2026-11-12', '2026-11-12', 'Pacific/Kiritimati')).toMatchObject([
      { startDate: '2026-11-12', start: '00:00', end: '00:30' },
    ])
    expect(toViewerOccurrencePeriod(event, '2026-11-10', 'Pacific/Kiritimati')).toMatchObject({
      startDate: '2026-11-12',
      start: '00:00',
    })
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
