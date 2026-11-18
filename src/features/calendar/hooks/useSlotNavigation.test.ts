import { describe, expect, it } from 'vitest'
import { moveSlot } from './useSlotNavigation.ts'

const dates = ['2026-11-16', '2026-11-17', '2026-11-18']

describe('moveSlot', () => {
  it('moves by an hour within the day and stops at midnight', () => {
    expect(moveSlot(dates, { date: dates[1], hour: 9 }, 'ArrowDown')).toEqual({ date: dates[1], hour: 10 })
    expect(moveSlot(dates, { date: dates[1], hour: 0 }, 'ArrowUp')).toEqual({ date: dates[1], hour: 0 })
    expect(moveSlot(dates, { date: dates[1], hour: 23 }, 'ArrowDown')).toEqual({ date: dates[1], hour: 23 })
  })

  it('moves between the shown days at the same hour', () => {
    expect(moveSlot(dates, { date: dates[1], hour: 14 }, 'ArrowRight')).toEqual({ date: dates[2], hour: 14 })
    expect(moveSlot(dates, { date: dates[0], hour: 14 }, 'ArrowLeft')).toEqual({ date: dates[0], hour: 14 })
  })

  it('jumps to the first and last hour and ignores other keys', () => {
    expect(moveSlot(dates, { date: dates[2], hour: 9 }, 'Home')).toEqual({ date: dates[2], hour: 0 })
    expect(moveSlot(dates, { date: dates[2], hour: 9 }, 'End')).toEqual({ date: dates[2], hour: 23 })
    expect(moveSlot(dates, { date: dates[2], hour: 9 }, 'a')).toBeNull()
  })
})
