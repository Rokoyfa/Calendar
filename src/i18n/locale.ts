export const SUPPORTED_LANGUAGES = ['en', 'de'] as const

export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LOCALE = 'en-US'

export const LOCALE_CHOICES = ['auto', 'en-US', 'en-GB', 'de-DE'] as const

export type LocaleChoice = (typeof LOCALE_CHOICES)[number]

const isSupportedLanguage = (language: string): language is Language =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(language)

const canonicalize = (tag: string | null | undefined) => {
  if (!tag) return null
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? null
  } catch {
    return null
  }
}

const toSupportedLocale = (tag: string | null | undefined) => {
  const canonical = canonicalize(tag)
  if (!canonical) return null
  const { language, region } = new Intl.Locale(canonical)
  if (isSupportedLanguage(language)) return canonical
  const fallback = region ? `en-${region}` : null
  return fallback && Intl.DateTimeFormat.supportedLocalesOf(fallback).length > 0 ? fallback : null
}

export const getLanguage = (locale: string): Language => {
  const { language } = new Intl.Locale(locale)
  return isSupportedLanguage(language) ? language : 'en'
}

type LocaleSources = {
  user?: string | null
  host?: string | null
  browser?: readonly string[]
}

export function resolveLocale({ user, host, browser = [] }: LocaleSources) {
  const candidates = [user === 'auto' ? null : user, host, ...browser]
  for (const candidate of candidates) {
    const locale = toSupportedLocale(candidate)
    if (locale) return locale
  }
  return DEFAULT_LOCALE
}

export const getBrowserLanguages = () => (typeof navigator === 'undefined' ? [] : navigator.languages)
