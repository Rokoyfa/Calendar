import { DEFAULT_LANGUAGE, isBuiltInLanguage, type BuiltInLanguage, type Language } from '../locale.ts'
import { en } from './en/index.ts'
import type { Messages, PartialMessages } from './types.ts'
import { isRecord } from '../../utils/parse.ts'

export type { DeepPartial, MessageOverrides, Messages, PartialMessages } from './types.ts'

const LOADERS: Record<Exclude<BuiltInLanguage, 'en'>, () => Promise<Messages>> = {
  de: () => import('./de/index.ts').then((module) => module.de),
  fr: () => import('./fr/index.ts').then((module) => module.fr),
  es: () => import('./es/index.ts').then((module) => module.es),
  it: () => import('./it/index.ts').then((module) => module.it),
  nl: () => import('./nl/index.ts').then((module) => module.nl),
  pl: () => import('./pl/index.ts').then((module) => module.pl),
  pt: () => import('./pt/index.ts').then((module) => module.pt),
}

const loaded = new Map<Language, Messages>([[DEFAULT_LANGUAGE, en]])

export const getLoadedMessages = (language: Language) => loaded.get(language) ?? null

export async function loadMessages(language: Language): Promise<Messages> {
  const cached = loaded.get(language)
  if (cached) return cached
  if (!isBuiltInLanguage(language) || language === 'en') return en
  const messages = await LOADERS[language]()
  loaded.set(language, messages)
  return messages
}

const mergeDeep = (base: unknown, override: unknown): unknown => {
  if (override === undefined) return base
  if (base !== undefined && typeof base !== typeof override) return base
  if (!isRecord(base) || !isRecord(override)) return override
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) result[key] = mergeDeep(base[key], value)
  return result
}

export const mergeMessages = (base: Messages, override: PartialMessages | undefined): Messages =>
  override ? (mergeDeep(base, override) as Messages) : base
