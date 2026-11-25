import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, parsePreferences } from './preferences.ts'

describe('preferences', () => {
  it('keeps a valid time zone and falls back to automatic', () => {
    expect(parsePreferences({}).timeZone).toBe('auto')
    expect(parsePreferences({ timeZone: 'America/New_York' }).timeZone).toBe('America/New_York')
    expect(parsePreferences({ timeZone: 'Mars/Base' }).timeZone).toBe(DEFAULT_PREFERENCES.timeZone)
  })

  it('keeps valid planning settings and falls back to the defaults', () => {
    expect(parsePreferences({})).toMatchObject({
      planningDistribution: 'even',
      planningCountry: 'auto',
      planningDayStart: '08:00',
      planningDayEnd: '20:00',
    })
    expect(
      parsePreferences({
        planningDistribution: 'early',
        planningCountry: 'AT',
        planningDayStart: '07:30',
        planningDayEnd: '17:00',
      }),
    ).toMatchObject({
      planningDistribution: 'early',
      planningCountry: 'AT',
      planningDayStart: '07:30',
      planningDayEnd: '17:00',
    })
    expect(
      parsePreferences({
        planningDistribution: 'late',
        planningCountry: 'de',
        planningDayStart: '18:00',
        planningDayEnd: '18:30',
      }),
    ).toMatchObject({
      planningDistribution: 'even',
      planningCountry: 'auto',
      planningDayStart: '08:00',
      planningDayEnd: '20:00',
    })
  })
})
