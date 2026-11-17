import { describe, expect, it } from 'vitest'
import { collectLocalData, exportFileName } from './dataExport.ts'

const storageOf = (entries: Record<string, string>) => {
  const keys = Object.keys(entries)
  return {
    length: keys.length,
    key: (index: number) => keys[index] ?? null,
    getItem: (key: string) => entries[key] ?? null,
  }
}

describe('collectLocalData', () => {
  it('takes only the calendar keys, sorted, and parses JSON values', () => {
    const result = collectLocalData(
      storageOf({ 'calendar.events.v1': '[{"id":"a"}]', other: 'x', 'calendar.colors.v1': 'not json' }),
      new Date('2026-11-16T10:00:00Z'),
    )
    expect(result).toEqual({
      format: 'calendar-browser-export',
      version: 1,
      exportedAt: '2026-11-16T10:00:00.000Z',
      data: { 'calendar.colors.v1': 'not json', 'calendar.events.v1': [{ id: 'a' }] },
    })
    expect(Object.keys(result.data)).toEqual(['calendar.colors.v1', 'calendar.events.v1'])
  })

  it('names the file after the day', () => {
    expect(exportFileName('2026-11-16')).toBe('calendar-export-2026-11-16.json')
  })
})
