import { describe, expect, it } from 'vitest'
import { calendarEvent, recurrence } from '../../../test/fixtures.ts'
import { expandEvents } from '../../../utils/event.ts'
import { applyDragDelta, getDragDelta, toDropInput } from './eventDrag.ts'

const period = { startDate: '2026-11-10', start: '09:00', endDate: '2026-11-10', end: '10:00' }

describe('event drag', () => {
  it('snaps time deltas to 15 minutes and counts days in day mode', () => {
    expect(getDragDelta('minutes', { date: '2026-11-10', minutes: 560 }, { date: '2026-11-11', minutes: 620 })).toBe(1500)
    expect(getDragDelta('days', { date: '2026-11-10', minutes: 0 }, { date: '2026-11-08', minutes: 0 })).toBe(-2880)
  })

  it('moves across midnight and resizes with a minimum length', () => {
    expect(applyDragDelta(period, 'move', 15 * 60)).toEqual({ startDate: '2026-11-11', start: '00:00', endDate: '2026-11-11', end: '01:00' })
    expect(applyDragDelta(period, 'resize', 90)).toEqual({ ...period, end: '11:30' })
    expect(applyDragDelta(period, 'resize', -120)).toEqual({ ...period, end: '09:15' })
  })

  it('converts the dropped period back to the event zone', () => {
    const event = calendarEvent({ ...period, timeZone: 'America/New_York' })
    const [occurrence] = expandEvents([event], '2026-11-10', '2026-11-10', 'Europe/Berlin')
    const moved = applyDragDelta(occurrence, 'move', 60)
    expect(toDropInput(occurrence, moved, 'Europe/Berlin', 'all')).toMatchObject({ start: '10:00', end: '11:00', timeZone: 'America/New_York' })
  })

  it('adapts weekly series to the new weekday unless only one occurrence moves', () => {
    const event = calendarEvent({ ...period, recurrence: recurrence({ frequency: 'weekly', weekdays: [1] }) })
    const [occurrence] = expandEvents([event], '2026-11-10', '2026-11-10', null)
    const moved = applyDragDelta(occurrence, 'move', 1440)
    expect(toDropInput(occurrence, moved, 'Europe/Berlin', 'all').recurrence?.weekdays).toEqual([2])
    expect(toDropInput(occurrence, moved, 'Europe/Berlin', 'single').recurrence?.weekdays).toEqual([1])
  })
})
