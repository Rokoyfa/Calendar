import { describe, expect, it } from 'vitest'
import {
  describeUserAgent,
  formatSecret,
  isRecoveryCode,
  isTwoFactorCode,
  normalizeTwoFactorCode,
} from './twoFactor.ts'

describe('two-factor helpers', () => {
  it('accepts six digits with spaces', () => {
    expect(isTwoFactorCode('123 456')).toBe(true)
    expect(normalizeTwoFactorCode('123 456')).toBe('123456')
    expect(isTwoFactorCode('12345')).toBe(false)
    expect(isTwoFactorCode('12a456')).toBe(false)
  })

  it('accepts recovery codes in their usual shapes', () => {
    expect(isRecoveryCode('a2a91-47690-70aa8-20dd6')).toBe(true)
    expect(isRecoveryCode('short')).toBe(false)
  })

  it('groups the secret for typing', () => {
    expect(formatSecret('ABCDEFGHIJKL')).toBe('ABCD EFGH IJKL')
  })

  it('names browser and system', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
      ),
    ).toBe('Chrome · Windows')
    expect(describeUserAgent('curl/8.0')).toBeNull()
    expect(describeUserAgent(null)).toBeNull()
  })
})
