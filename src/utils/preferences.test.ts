import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, parsePreferences } from './preferences.ts'

describe('preferences', () => {
  it('keeps a valid time zone and falls back to automatic', () => {
    expect(parsePreferences({}).timeZone).toBe('auto')
    expect(parsePreferences({ timeZone: 'America/New_York' }).timeZone).toBe('America/New_York')
    expect(parsePreferences({ timeZone: 'Mars/Base' }).timeZone).toBe(DEFAULT_PREFERENCES.timeZone)
  })
})
