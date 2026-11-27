import { describe, expect, it } from 'vitest'
import { createFormatter } from '../../../i18n/format.ts'
import { calendarEvent } from '../../../test/fixtures.ts'
import { expandEvents } from '../../../domain/event.ts'
import { buildPrintDocument, type PrintOptions } from './print.ts'

const options = (overrides: Partial<PrintOptions> = {}): PrintOptions => ({
  title: 'Woche 48',
  view: 'week',
  dates: ['2026-11-23', '2026-11-24', '2026-11-25'],
  occurrences: expandEvents(
    [
      calendarEvent({
        id: 'a',
        title: '<Training>',
        startDate: '2026-11-23',
        endDate: '2026-11-23',
        start: '10:00',
        end: '11:30',
        location: 'Halle 2',
      }),
      calendarEvent({
        id: 'b',
        title: 'Nacht',
        startDate: '2026-11-24',
        endDate: '2026-11-25',
        start: '22:00',
        end: '00:00',
      }),
    ],
    '2026-11-23',
    '2026-11-25',
  ),
  holidays: new Map([['2026-11-25', ['Buß- und Bettag']]]),
  calendarName: () => 'Verein',
  language: 'de-DE',
  format: createFormatter('de-DE', 1),
  texts: { allDay: 'Ganztägig', empty: 'Keine Termine.' },
  ...overrides,
})

describe('buildPrintDocument', () => {
  it('lists the days with events, escapes text and leaves out an end at midnight', () => {
    const html = buildPrintDocument(options())
    expect(html).toContain('<strong>&#60;Training&#62;</strong> · Halle 2 · Verein')
    expect(html).toContain('10:00–11:30')
    expect(html).toContain('22:00–')
    expect(html.match(/Nacht/g)).toHaveLength(1)
    expect(html).toContain('Buß- und Bettag')
  })

  it('says when there is nothing to print', () => {
    expect(buildPrintDocument(options({ occurrences: [], holidays: new Map() }))).toContain('Keine Termine.')
  })

  it('draws a grid for the month view', () => {
    const dates = Array.from(
      { length: 35 },
      (_, index) => `2026-${index < 30 ? '11' : '12'}-${String((index % 30) + 1).padStart(2, '0')}`,
    )
    const html = buildPrintDocument(options({ view: 'month', dates }))
    expect(html).toContain('<table class="month">')
    expect(html.match(/<tr>/g)).toHaveLength(6)
  })
})
