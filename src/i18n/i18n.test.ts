import { describe, expect, it } from 'vitest'
import { createFormatter } from './format.ts'
import { getLanguage, resolveLocale } from './locale.ts'
import { MESSAGES } from './messages/index.ts'
import { getWeekInfo } from './weekInfo.ts'

describe('i18n', () => {
  it('resolves the locale by priority', () => {
    expect(resolveLocale({ user: 'de-DE', host: 'en-GB', browser: ['en-US'] })).toBe('de-DE')
    expect(resolveLocale({ user: 'auto', host: 'en-GB', browser: ['de-DE'] })).toBe('en-GB')
    expect(resolveLocale({ browser: ['fr-FR'] })).toBe('en-FR')
    expect(resolveLocale({})).toBe('en-US')
    expect(getLanguage('de-AT')).toBe('de')
  })

  it('derives week rules from the region', () => {
    expect(getWeekInfo('en-US').firstDay).toBe(0)
    expect(getWeekInfo('de-DE')).toEqual({ firstDay: 1, minimalDays: 4 })
    expect(getWeekInfo('en-GB').firstDay).toBe(1)
  })

  it('formats times by region', () => {
    expect(createFormatter('en-US', 0).time(13 * 60 + 30)).toMatch(/1:30\sPM/)
    expect(createFormatter('de-DE', 1).time(13 * 60 + 30)).toBe('13:30')
    expect(createFormatter('en-US', 0).shortWeekdays[0].weekday).toBe(6)
  })

  it('translates week numbers', () => {
    expect(MESSAGES.en.views.weekNumber(45)).toBe('Wk 45')
    expect(MESSAGES.de.views.weekNumber(45)).toBe('KW 45')
  })

  it('has the same keys in every language', () => {
    const keys = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}${key}.`))
        : [prefix]
    expect(keys(MESSAGES.de).toSorted()).toEqual(keys(MESSAGES.en).toSorted())
  })
})
