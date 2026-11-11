import { createContext } from 'react'
import type { Formatter } from './format.ts'
import type { Language } from './locale.ts'
import type { Messages } from './messages/index.ts'
import type { WeekInfo } from './weekInfo.ts'

export type I18n = {
  locale: string
  language: Language
  languages: ReadonlySet<string>
  m: Messages
  format: Formatter
  weekInfo: WeekInfo
}

export type I18nContextValue = I18n & {
  setUserLocale: (locale: string | null) => void
}

export const I18nContext = createContext<I18nContextValue | null>(null)
