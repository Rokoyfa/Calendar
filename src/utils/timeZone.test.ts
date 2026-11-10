import { describe, expect, it } from 'vitest'
import { convertWallTime, formatTimeZoneOffset, isTimeZone, toInstant } from './timeZone.ts'

describe('time zones', () => {
  it('recognizes IANA zones', () => {
    expect(isTimeZone('America/New_York')).toBe(true)
    expect(isTimeZone('Mars/Base')).toBe(false)
    expect(isTimeZone(null)).toBe(false)
  })

  it('converts wall times between zones', () => {
    expect(convertWallTime({ date: '2026-11-05', time: '09:00' }, 'Europe/Berlin', 'America/New_York')).toEqual({
      date: '2026-11-05',
      time: '03:00',
    })
    expect(convertWallTime({ date: '2026-11-05', time: '20:00' }, 'America/Los_Angeles', 'Europe/Berlin')).toEqual({
      date: '2026-11-06',
      time: '05:00',
    })
    expect(convertWallTime({ date: '2026-07-01', time: '12:00' }, 'Asia/Kolkata', 'UTC')).toEqual({
      date: '2026-07-01',
      time: '06:30',
    })
  })

  it('keeps the wall time across daylight saving in the event zone', () => {
    const before = convertWallTime({ date: '2026-10-24', time: '09:00' }, 'Europe/Berlin', 'UTC')
    const after = convertWallTime({ date: '2026-10-26', time: '09:00' }, 'Europe/Berlin', 'UTC')
    expect([before.time, after.time]).toEqual(['07:00', '08:00'])
  })

  it('moves times in a daylight saving gap forward', () => {
    expect(new Date(toInstant({ date: '2026-03-29', time: '02:30' }, 'Europe/Berlin')).toISOString()).toBe(
      '2026-03-29T01:30:00.000Z',
    )
  })

  it('formats offsets', () => {
    expect(formatTimeZoneOffset('Asia/Kolkata')).toBe('UTC+5:30')
    expect(formatTimeZoneOffset('UTC')).toBe('UTC+0')
  })
})
