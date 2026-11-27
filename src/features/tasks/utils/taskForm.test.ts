import { describe, expect, it } from 'vitest'
import { toEstimateMinutes, toEstimateParts } from './taskForm.ts'

describe('task estimate', () => {
  it('converts between minutes and hour and minute parts', () => {
    expect(toEstimateParts(95)).toEqual({ hours: '1', minutes: '35' })
    expect(toEstimateParts(null)).toEqual({ hours: '', minutes: '' })
    expect(toEstimateMinutes({ hours: '1', minutes: '35' })).toBe(95)
    expect(toEstimateMinutes({ hours: '', minutes: '' })).toBeNull()
    expect(toEstimateMinutes({ hours: '100', minutes: '' })).toBeUndefined()
    expect(toEstimateMinutes({ hours: '', minutes: '60' })).toBeUndefined()
  })
})
