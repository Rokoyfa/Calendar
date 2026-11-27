import { describe, expect, it } from 'vitest'
import { buildSharedLink, parseSharedCalendar } from './sharedCalendar.ts'

const categories = [
  { id: 'a', calendarId: 'c1', name: 'Training' },
  { id: 'b', calendarId: 'c1', name: 'Spiel' },
  { id: 'c', calendarId: 'c2', name: 'Training' },
]

describe('shared calendars', () => {
  it('parses the public description of a calendar', () => {
    expect(parseSharedCalendar({ id: 'c1', name: 'Verein', color: 'nope', categories })).toEqual({
      id: 'c1',
      name: 'Verein',
      color: 'blue',
      categories,
    })
    expect(parseSharedCalendar({ name: 'x' })).toBeNull()
  })

  it('builds links for both routing modes', () => {
    const page = 'https://example.com/team/page?tab=2#top'
    expect(buildSharedLink('t k', { routing: 'memory', linkParam: 'calendarPath' }, page)).toBe(
      'https://example.com/team/page?calendarPath=%2Fshared%2Ft%2520k',
    )
    expect(buildSharedLink('abc', { routing: 'browser', basename: '/cal/', linkParam: 'x' }, page)).toBe(
      'https://example.com/cal/shared/abc',
    )
    expect(buildSharedLink('abc', { routing: 'memory', linkParam: false }, page)).toBeNull()
    expect(buildSharedLink('abc', undefined, page)).toBeNull()
  })
})
