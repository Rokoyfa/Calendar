import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRootElement } from '../context/RootElementContext.ts'
import { createFormatter } from './format.ts'
import { I18nContext, type I18nContextValue } from './I18nContext.ts'
import { BUILT_IN_LANGUAGES, getBrowserLanguages, getLanguage, resolveLocale } from './locale.ts'
import { getLoadedMessages, loadMessages, mergeMessages, type MessageOverrides, type Messages } from './messages/index.ts'
import { getWeekInfo } from './weekInfo.ts'

type I18nProviderProps = {
  locale?: string
  messages?: MessageOverrides
  children: ReactNode
}

type LoadedMessages = { language: string; messages: Messages }

const NO_OVERRIDES: MessageOverrides = {}

export function I18nProvider({ locale: hostLocale, messages: overrides = NO_OVERRIDES, children }: I18nProviderProps) {
  const root = useRootElement()
  const [userLocale, setUserLocale] = useState<string | null>(null)
  const languages = useMemo(() => new Set<string>([...BUILT_IN_LANGUAGES, ...Object.keys(overrides)]), [overrides])
  const locale = useMemo(
    () => resolveLocale({ user: userLocale, host: hostLocale, browser: getBrowserLanguages(), languages }),
    [userLocale, hostLocale, languages],
  )
  const language = getLanguage(locale, languages)
  const [loaded, setLoaded] = useState<LoadedMessages | null>(() => {
    const messages = getLoadedMessages(language)
    return messages ? { language, messages } : null
  })

  useEffect(() => root.setAttribute('lang', locale), [root, locale])

  useEffect(() => {
    if (loaded?.language === language) return
    let isCurrent = true
    void loadMessages(language).then((messages) => {
      if (isCurrent) setLoaded({ language, messages })
    })
    return () => {
      isCurrent = false
    }
  }, [language, loaded])

  const value = useMemo<I18nContextValue | null>(() => {
    if (!loaded) return null
    const weekInfo = getWeekInfo(locale)
    return {
      locale,
      language: loaded.language,
      languages,
      m: mergeMessages(loaded.messages, overrides[loaded.language]),
      format: createFormatter(locale, weekInfo.firstDay),
      weekInfo,
      setUserLocale,
    }
  }, [locale, loaded, languages, overrides])

  if (!value) return null

  return <I18nContext value={value}>{children}</I18nContext>
}
