import { describe, expect, it } from 'vitest'
import { findNextEvent } from './useEventNavigation.ts'

type Target = HTMLElement & { day: string }

const target = (day: string) => ({ day }) as Target
const mon1 = target('mon')
const mon2 = target('mon')
const tue1 = target('tue')
const thu1 = target('thu')
const thu2 = target('thu')
const all = [mon1, mon2, tue1, thu1, thu2]
const dayOf = (element: HTMLElement) => ({ mon: 1, tue: 2, thu: 4 })[(element as Target).day] as unknown as Element
const next = (current: Target, key: string) => findNextEvent(all, current, key, dayOf)

describe('findNextEvent', () => {
  it('moves up and down within a day and stops at its ends', () => {
    expect(next(mon1, 'ArrowDown')).toBe(mon2)
    expect(next(mon2, 'ArrowUp')).toBe(mon1)
    expect(next(mon2, 'ArrowDown')).toBeNull()
  })

  it('jumps to the next or previous day with events, keeping the position where possible', () => {
    expect(next(mon2, 'ArrowRight')).toBe(tue1)
    expect(next(tue1, 'ArrowRight')).toBe(thu1)
    expect(next(thu2, 'ArrowLeft')).toBe(tue1)
    expect(next(tue1, 'ArrowLeft')).toBe(mon1)
    expect(next(thu1, 'ArrowRight')).toBeNull()
  })

  it('goes to the first and last event with Home and End', () => {
    expect(next(tue1, 'Home')).toBe(mon1)
    expect(next(tue1, 'End')).toBe(thu2)
  })
})
