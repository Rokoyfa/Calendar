import { describe, expect, it } from 'vitest'
import { calendarEvent, recurrence } from '../test/fixtures.ts'
import { getScheduledReminders } from './reminders.ts'

const at = (iso: string) => new Date(iso).getTime()

describe('reminders', () => {
  it('schedules reminders before each occurrence in the viewer zone', () => {
    const event = calendarEvent({
      startDate: '2026-11-10',
      start: '09:00',
      endDate: '2026-11-10',
      end: '10:00',
      timeZone: 'America/New_York',
      reminders: [15],
      recurrence: recurrence(),
    })
    const due = getScheduledReminders([event], 'Europe/Berlin', at('2026-11-10T13:00:00Z'), at('2026-11-11T15:00:00Z'))
    expect(due.map(({ at: time, minutes }) => [new Date(time).toISOString(), minutes])).toEqual([
      ['2026-11-10T13:45:00.000Z', 15],
      ['2026-11-11T13:45:00.000Z', 15],
    ])
  })

  it('ignores events without reminders and reminders outside the window', () => {
    const quiet = calendarEvent({ startDate: '2026-11-10', endDate: '2026-11-10' })
    const later = calendarEvent({ startDate: '2026-11-20', endDate: '2026-11-20', reminders: [60] })
    expect(getScheduledReminders([quiet, later], 'Europe/Berlin', at('2026-11-10T00:00:00Z'), at('2026-11-11T00:00:00Z'))).toEqual([])
  })
})
