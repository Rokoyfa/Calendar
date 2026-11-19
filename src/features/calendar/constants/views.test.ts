import { describe, expect, it } from 'vitest'
import { AGENDA_DAYS, VIEW_DEFINITIONS, VIEW_SHORTCUTS } from './views.ts'

describe('agenda view', () => {
  it('shows 30 days from the anchor and pages by 30 days', () => {
    const { getRange, step } = VIEW_DEFINITIONS.agenda
    expect(AGENDA_DAYS).toBe(30)
    expect(getRange('2026-11-19', 1)).toEqual({ from: '2026-11-19', to: '2026-12-18' })
    expect(step('2026-11-19', 1)).toBe('2026-12-19')
    expect(step('2026-11-19', -1)).toBe('2026-10-20')
  })

  it('has its own shortcut', () => {
    const keys = Object.values(VIEW_SHORTCUTS)
    expect(VIEW_SHORTCUTS.agenda).toBe('a')
    expect(new Set(keys).size).toBe(keys.length)
  })
})
