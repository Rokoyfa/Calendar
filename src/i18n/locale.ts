export const BUILT_IN_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt'] as const

export type BuiltInLanguage = (typeof BUILT_IN_LANGUAGES)[number]

export type Language = string

export const DEFAULT_LANGUAGE: BuiltInLanguage = 'en'

const DEFAULT_LOCALE = 'en-US'

export const AUTO_LOCALE = 'auto'

const BUILT_IN_LOCALES = [
  'en-US',
  'en-GB',
  'de-DE',
  'fr-FR',
  'es-ES',
  'it-IT',
  'nl-NL',
  'pl-PL',
  'pt-BR',
  'pt-PT',
] as const

export const isBuiltInLanguage = (language: string): language is BuiltInLanguage =>
  (BUILT_IN_LANGUAGES as readonly string[]).includes(language)

export const canonicalizeLocale = (tag: unknown) => {
  if (typeof tag !== 'string' || tag === '') return null
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? null
  } catch {
    return null
  }
}

const toAvailableLocale = (tag: string | null | undefined, languages: ReadonlySet<string>) => {
  const canonical = canonicalizeLocale(tag)
  if (!canonical) return null
  const { language, region } = new Intl.Locale(canonical)
  if (languages.has(language)) return canonical
  const fallback = region ? `${DEFAULT_LANGUAGE}-${region}` : null
  return fallback && Intl.DateTimeFormat.supportedLocalesOf(fallback).length > 0 ? fallback : null
}

const BUILT_IN_SET: ReadonlySet<string> = new Set(BUILT_IN_LANGUAGES)

export const getLanguage = (locale: string, languages: ReadonlySet<string> = BUILT_IN_SET): Language => {
  const { language } = new Intl.Locale(locale)
  return languages.has(language) ? language : DEFAULT_LANGUAGE
}

type LocaleSources = {
  user?: string | null
  host?: string | null
  browser?: readonly string[]
  languages?: ReadonlySet<string>
}

export function resolveLocale({ user, host, browser = [], languages = BUILT_IN_SET }: LocaleSources) {
  const candidates = [user === AUTO_LOCALE ? null : user, host, ...browser]
  for (const candidate of candidates) {
    const locale = toAvailableLocale(candidate, languages)
    if (locale) return locale
  }
  return DEFAULT_LOCALE
}

export const getLocaleChoices = (extraLanguages: Iterable<string> = []) => {
  const extra = [...extraLanguages].filter((language) => !isBuiltInLanguage(language))
  return [AUTO_LOCALE, ...BUILT_IN_LOCALES, ...extra]
}

export const getLocaleName = (locale: string) => {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language', languageDisplay: 'standard' }).of(locale) ?? locale
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
  } catch {
    return locale
  }
}

export const getBrowserLanguages = () => (typeof navigator === 'undefined' ? [] : navigator.languages)
