import { describe, expect, it } from 'vitest'
import { groupHolidaysByDate, parsePublicHolidays, resolveHolidayRegion } from './holidays.ts'

describe('holidays', () => {
  it('resolves the region from setting, host and locale', () => {
    expect(resolveHolidayRegion('auto', undefined, 'de-DE')).toBe('DE')
    expect(resolveHolidayRegion('auto', undefined, 'fr')).toBe('FR')
    expect(resolveHolidayRegion('auto', 'DE-NW', 'en-US')).toBe('DE-NW')
    expect(resolveHolidayRegion('auto', 'off', 'de-DE')).toBeNull()
    expect(resolveHolidayRegion('AT', 'DE-NW', 'de-DE')).toBe('AT')
    expect(resolveHolidayRegion('off', 'DE-NW', 'de-DE')).toBeNull()
  })

  it('reads holidays from a backend and groups them by date', () => {
    const parsed = parsePublicHolidays([
      { date: '2026-12-25', name: 'A' },
      { date: 'x', name: 'B' },
      { date: '2026-12-25', name: 'C' },
    ])
    expect(groupHolidaysByDate(parsed).get('2026-12-25')).toEqual(['A', 'C'])
  })
})
