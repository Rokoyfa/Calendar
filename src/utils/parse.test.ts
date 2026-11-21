import { describe, expect, it } from 'vitest'
import { AppError } from './appError.ts'
import { asRecord, filledTextOrNull, isRecord, parseList, requireValue, textOrEmpty, textOrNull } from './parse.ts'

describe('parse helpers', () => {
  it('reads records', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord([])).toBe(false)
    expect(isRecord(null)).toBe(false)
    expect(asRecord('x')).toEqual({})
    expect(asRecord({ a: 1 })).toEqual({ a: 1 })
  })

  it('reads text', () => {
    expect(textOrEmpty(1)).toBe('')
    expect(textOrNull(1)).toBeNull()
    expect(textOrNull('')).toBe('')
    expect(filledTextOrNull('')).toBeNull()
    expect(filledTextOrNull('a')).toBe('a')
  })

  it('keeps only valid list entries', () => {
    expect(parseList('x', () => 1)).toEqual([])
    expect(parseList([1, 'a', 2], (value) => (typeof value === 'number' ? value * 2 : null))).toEqual([2, 4])
  })

  it('requires a parsed value', () => {
    expect(requireValue(0)).toBe(0)
    expect(() => requireValue(null)).toThrow(AppError)
  })
})
