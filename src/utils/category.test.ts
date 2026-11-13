import { describe, expect, it } from 'vitest'
import { buildSharedLink, parseSharedCalendar } from './sharedCalendar.ts'
import {
  isCategoryNameTaken,
  matchesCategoryFilter,
  normalizeCategoryName,
  parseCategories,
  parseCategoryIds,
  toggleCategoryFilter,
  UNCATEGORIZED,
} from './category.ts'

const categories = [
  { id: 'a', calendarId: 'c1', name: 'Training' },
  { id: 'b', calendarId: 'c1', name: 'Spiel' },
  { id: 'c', calendarId: 'c2', name: 'Training' },
]

describe('categories', () => {
  it('parses lists and drops broken entries', () => {
    expect(parseCategories([...categories, { id: 'x' }, null, { id: 'y', calendarId: 'c1', name: '  ' }])).toEqual(
      categories,
    )
    expect(parseCategories('nothing')).toEqual([])
  })

  it('cleans event category ids', () => {
    expect(parseCategoryIds(['a', 'a', '', 5, 'b'])).toEqual(['a', 'b'])
    expect(parseCategoryIds(['1', '2', '3', '4', '5', '6'])).toHaveLength(5)
    expect(parseCategoryIds(undefined)).toEqual([])
  })

  it('compares names per calendar and without case', () => {
    expect(normalizeCategoryName('  Heim   Spiel ')).toBe('Heim Spiel')
    expect(isCategoryNameTaken(categories, 'c1', ' training ')).toBe(true)
    expect(isCategoryNameTaken(categories, 'c1', 'Training', 'a')).toBe(false)
    expect(isCategoryNameTaken(categories, 'c2', 'Spiel')).toBe(false)
  })

  it('filters events, treating unknown categories as none', () => {
    const known = new Set(['a', 'b'])
    expect(matchesCategoryFilter(['a'], known, null)).toBe(true)
    expect(matchesCategoryFilter(['a'], known, new Set(['b']))).toBe(false)
    expect(matchesCategoryFilter(['a', 'b'], known, new Set(['b']))).toBe(true)
    expect(matchesCategoryFilter([], known, new Set(['b']))).toBe(false)
    expect(matchesCategoryFilter(['gone'], known, new Set([UNCATEGORIZED]))).toBe(true)
  })

  it('toggles the filter and clears it when everything is shown', () => {
    const all = ['a', 'b', UNCATEGORIZED]
    const withoutA = toggleCategoryFilter(null, all, 'a')
    expect([...(withoutA ?? [])].sort()).toEqual(['', 'b'])
    expect(toggleCategoryFilter(withoutA, all, 'a')).toBeNull()
  })
})

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
