import { describe, expect, it } from 'vitest'
import { libraryHolidays } from './holidayLibrary.ts'

describe('holiday library', () => {
  it('lists public holidays of a state only where they apply', async () => {
    const range = { from: '2027-01-01', to: '2027-12-31', language: 'de' }
    const bavaria = (await libraryHolidays.list({ ...range, region: 'DE-BY' })).map(({ name }) => name)
    const germany = (await libraryHolidays.list({ ...range, region: 'DE' })).map(({ name }) => name)
    expect(bavaria).toContain('Heilige Drei Könige')
    expect(germany).not.toContain('Heilige Drei Könige')
    expect(germany).toContain('Tag der Deutschen Einheit')
    expect(germany).not.toContain('Valentinstag')
  })
})
