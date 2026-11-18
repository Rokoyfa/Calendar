import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '../i18n/errorMessage.ts'
import { de } from '../i18n/messages/de/index.ts'
import { ApiError, parseRetryAfter } from './apiError.ts'

describe('parseRetryAfter', () => {
  it('reads seconds and HTTP dates', () => {
    expect(parseRetryAfter('30')).toBe(30)
    expect(parseRetryAfter('Wed, 18 Nov 2026 19:00:30 GMT', Date.parse('2026-11-18T19:00:00Z'))).toBe(30)
    expect(parseRetryAfter('soon')).toBeNull()
    expect(parseRetryAfter(null)).toBeNull()
  })
})

describe('rate limits', () => {
  it('turns 429 without a known code into rateLimited and shows the wait time', () => {
    const error = ApiError.fromResponse(429, { code: 'slowDown', message: 'Slow down' }, 90)
    expect(error.code).toBe('rateLimited')
    expect(getErrorMessage(error, de)).toBe('Zu viele Anfragen. Bitte in 2 Minuten erneut versuchen.')
  })

  it('keeps a more specific code such as tooManyLoginAttempts', () => {
    const error = ApiError.fromResponse(429, { code: 'tooManyLoginAttempts', message: 'x' })
    expect(error.code).toBe('tooManyLoginAttempts')
  })
})
