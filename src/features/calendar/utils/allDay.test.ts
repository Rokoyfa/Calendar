import { describe, expect, it } from 'vitest'
import { calendarEvent } from '../../../test/fixtures.ts'
import { createAllDayEventInput, expandEvents } from '../../../utils/event.ts'
import { splitAllDay } from './allDay.ts'
import { groupSegmentsByDate } from './segmentEvents.ts'

const dates = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12']
const range = { from: dates[0], to: dates[3] }

describe('splitAllDay', () => {
  it('keeps multi-day events in one row and fills gaps', () => {
    const events = [
      calendarEvent({ ...createAllDayEventInput('2026-11-09', '2026-11-11'), title: 'Long' }),
      calendarEvent({ ...createAllDayEventInput('2026-11-10'), title: 'Short' }),
      calendarEvent({ ...createAllDayEventInput('2026-11-12'), title: 'Later' }),
      calendarEvent({ title: 'Timed', startDate: '2026-11-10', endDate: '2026-11-10' }),
    ]
    const lanes = splitAllDay(dates, groupSegmentsByDate(expandEvents(events, range.from, range.to), range))
    const rowsOn = (date: string) =>
      lanes.allDay.get(date)?.map(({ segment, row, isFirst }) => [segment.event.title, row, isFirst])
    expect(lanes.rows).toBe(2)
    expect(rowsOn('2026-11-10')).toEqual([['Long', 0, false], ['Short', 1, true]])
    expect(rowsOn('2026-11-12')).toEqual([['Later', 0, true]])
    expect(lanes.timed.get('2026-11-10')?.map(({ event }) => event.title)).toEqual(['Timed'])
  })
})
