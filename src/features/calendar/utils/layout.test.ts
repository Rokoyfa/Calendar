import { describe, expect, it } from 'vitest'
import { calendarEvent } from '../../../test/fixtures.ts'
import { expandEvents } from '../../../utils/event.ts'
import { layoutEvents } from './layoutEvents.ts'
import { splitEventIntoSegments } from './segmentEvents.ts'
import { getHoursOnDate, toSlotRange } from './slotSelection.ts'

const occurrence = (overrides: Parameters<typeof calendarEvent>[0]) =>
  expandEvents([calendarEvent(overrides)], '2026-11-01', '2026-11-30')[0]

describe('calendar layout', () => {
  it('splits multi-day events into day segments', () => {
    const event = occurrence({ startDate: '2026-11-02', start: '22:00', endDate: '2026-11-04', end: '01:00' })
    expect(splitEventIntoSegments(event, { from: '2026-11-01', to: '2026-11-30' })).toMatchObject([
      { date: '2026-11-02', start: 1320, end: 1440, continuesBefore: false, continuesAfter: true },
      { date: '2026-11-03', start: 0, end: 1440, continuesBefore: true, continuesAfter: true },
      { date: '2026-11-04', start: 0, end: 60, continuesBefore: true, continuesAfter: false },
    ])
  })

  it('puts overlapping events side by side', () => {
    const [a, b, c] = [
      { start: '09:00', end: '11:00' },
      { start: '10:00', end: '12:00' },
      { start: '13:00', end: '14:00' },
    ].map((time) => splitEventIntoSegments(occurrence(time), { from: '2026-11-02', to: '2026-11-02' })[0])
    const positioned = layoutEvents([a, b, c])
    expect(positioned.map(({ column, columns }) => `${column}/${columns}`)).toEqual(['0/2', '1/2', '0/1'])
  })

  it('orders slot selections and limits hours per day', () => {
    const range = toSlotRange({ anchor: { date: '2026-11-08', hour: 18 }, current: { date: '2026-11-06', hour: 12 } })
    expect(range.first).toEqual({ date: '2026-11-06', hour: 12 })
    expect(getHoursOnDate(range, '2026-11-07')).toEqual({ fromHour: 0, toHour: 23 })
    expect(getHoursOnDate(range, '2026-11-08')).toEqual({ fromHour: 0, toHour: 18 })
    expect(getHoursOnDate(range, '2026-11-09')).toBeNull()
  })
})
