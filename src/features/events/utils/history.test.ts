import { describe, expect, it } from 'vitest'
import { parseHistoryPage } from './history.ts'

describe('history', () => {
  it('parses entries and drops unknown fields and actions', () => {
    const page = parseHistoryPage({
      entries: [
        {
          id: 'h1',
          action: 'updated',
          changedAt: '2026-11-19T10:00:00.000Z',
          changedBy: { id: 'u1', name: 'Anna' },
          changes: [
            { field: 'title', old: 'Plan', new: 'Plan B' },
            { field: 'attendees', old: null, new: null },
            { field: 'secret', old: 'x', new: 'y' },
          ],
        },
        { id: 'h2', action: 'exploded', changedAt: '2026-11-19T10:00:00.000Z' },
        { id: 'h3', action: 'created', changedAt: '2026-11-18T10:00:00.000Z', changedBy: null },
      ],
      hasMore: true,
    })
    expect(page.hasMore).toBe(true)
    expect(page.entries.map(({ id }) => id)).toEqual(['h1', 'h3'])
    expect(page.entries[0].changes.map(({ field }) => field)).toEqual(['title', 'attendees'])
    expect(page.entries[1].changedBy).toBeNull()
  })

  it('copes with an empty answer', () => {
    expect(parseHistoryPage(undefined)).toEqual({ entries: [], hasMore: false })
  })
})
