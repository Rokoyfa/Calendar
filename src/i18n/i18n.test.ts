import { describe, expect, it } from 'vitest'
import { createFormatter } from './format.ts'
import { getLanguage, getLocaleName, resolveLocale } from './locale.ts'
import { BUILT_IN_LANGUAGES } from './locale.ts'
import { loadMessages, mergeMessages } from './messages/index.ts'
import { en } from './messages/en/index.ts'
import { getWeekInfo } from './weekInfo.ts'

describe('i18n', () => {
  it('resolves the locale by priority', () => {
    expect(resolveLocale({ user: 'de-DE', host: 'en-GB', browser: ['en-US'] })).toBe('de-DE')
    expect(resolveLocale({ user: 'auto', host: 'en-GB', browser: ['de-DE'] })).toBe('en-GB')
    expect(resolveLocale({ browser: ['fr-FR'] })).toBe('fr-FR')
    expect(resolveLocale({ browser: ['sv-SE'] })).toBe('en-SE')
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

  it('translates week numbers', async () => {
    expect(en.views.weekNumber(45)).toBe('Wk 45')
    expect((await loadMessages('de')).views.weekNumber(45)).toBe('KW 45')
  })

  it('adds host languages and overrides single texts', () => {
    const languages = new Set(['en', 'de', 'sv'])
    expect(resolveLocale({ browser: ['sv-SE'], languages })).toBe('sv-SE')
    expect(getLanguage('sv-SE', languages)).toBe('sv')
    const merged = mergeMessages(en, { calendar: { today: 'Idag' }, views: { weekNumber: (week) => `V. ${week}` } })
    expect(merged.calendar.today).toBe('Idag')
    expect(merged.calendar.newEvent).toBe(en.calendar.newEvent)
    expect(merged.views.weekNumber(3)).toBe('V. 3')
  })

  it('names locales in their own language', () => {
    expect(getLocaleName('fr-FR')).toMatch(/^Français/)
    expect(getLocaleName('de-DE')).toMatch(/^Deutsch/)
  })

  it.each(BUILT_IN_LANGUAGES)('has the same texts in %s as in English', async (language) => {
    const shape = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? Object.entries(value).flatMap(([key, child]) => shape(child, `${prefix}${key}.`))
        : Array.isArray(value)
          ? [`${prefix}[${value.length}]`, ...value.flatMap((item, index) => shape(item, `${prefix}${index}.`))]
          : [`${prefix}:${typeof value}`]
    expect(shape(await loadMessages(language)).toSorted()).toEqual(shape(en).toSorted())
  })
})
